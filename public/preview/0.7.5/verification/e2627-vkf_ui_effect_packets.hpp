#pragma once

#include "compiler/native/vkf_compiled_geometry_packet.hpp"
#include "compiler/native/vkf_native_scene_packing.hpp"
#include "compiler/native/vkf_retained_scene_arena.hpp"
#include "compiler/native/vkf_retained_scene_packet.hpp"
#include "compiler/native/vkf_wasm_value_layout.hpp"

#include <algorithm>
#include <array>
#include <limits>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <stdexcept>
#include <string>
#include <map>
#include <optional>
#include <set>
#include <vector>

namespace vkf::ui_effect_packets {

// The optional binary sink changes transport only. The same compiler-owned
// reader and scene packer validate and produce every metadata field and byte.
using PackedArenas = std::vector<std::vector<std::uint8_t>>;

// Replace only temporal expression leaves with their ORIGINAL evaluated
// operands. The normal LayerTimeEvaluator retains its axis/shape/mode checks.
// Sampling must never replay a source binding, physics call or embedding.
inline vf::JsonValue::Object evaluated_temporal_operation(
    const vf::JsonValue::Object& operation, const vf::JsonValue::Object& operands
) {
    const auto constant = [](const vf::JsonValue& value) {
        return vf::JsonValue(vf::JsonValue::Object{
            {"kind", "const"}, {"type", "any"}, {"value", value}});
    };
    auto result = operation;
    vf::JsonValue::Object properties;
    for (const auto& [name, value] : operands) properties[name] = constant(value);
    result["properties"] = vf::JsonValue(std::move(properties));
    auto& channels = result.at("channels").as_array();
    for (auto& raw : channels) {
        auto& channel = raw.as_object();
        std::string property;
        if (channel.count("property")) property = channel.at("property").as_string();
        else {
            const auto name = channel.at("name").as_string();
            property = name == "p" ? "p_tp" : name == "c" ? "c_tc" : name == "s" ? "s_t" : "";
        }
        const auto found = operands.find(property);
        if (found == operands.end()) throw std::runtime_error("executed temporal Layer is missing its original channel " + property);
        channel["value"] = constant(found->second);
    }
    auto& time = result.at("time").as_object();
    for (const auto& pair : std::vector<std::pair<std::string,std::string>>{
            {"coordinates","t"},{"min","t_min"},{"max","t_max"},{"mode","t_mode"}}) {
        if (!time.count(pair.first)) continue;
        const auto found = operands.find(pair.second);
        if (found != operands.end()) time[pair.first] = constant(found->second);
        else {
            // Only the frontend's literal default interval may be absent from
            // captured arguments. Never evaluate a missing source expression.
            const auto& value = time.at(pair.first).as_object();
            if (!value.count("kind") || value.at("kind").as_string() != "const")
                throw std::runtime_error("executed temporal Layer is missing its original time operand " + pair.second);
        }
    }
    return result;
}
inline vf::JsonValue packed_retained_scene(native_scene::PackedScene packed,
                                          PackedArenas* binary_arenas) {
    vf::JsonValue::Object packet{
        {"schema", vf::JsonValue("vektor-flow/retained-scene-arena")},
        {"version", vf::JsonValue(1.0)},
        {"metadata", vf::parse_json(packed.metadata_json)},
    };
    if (binary_arenas) {
        packet["arena"] = vf::JsonValue(vf::JsonValue::Object{
            {"storage", vf::JsonValue("compiler-binary")},
            {"index", vf::JsonValue(double(binary_arenas->size()))},
            {"byte_length", vf::JsonValue(double(packed.arena_bytes.size()))},
        });
        binary_arenas->push_back(std::move(packed.arena_bytes));
    } else {
        vf::JsonValue::Array arena;
        arena.reserve(packed.arena_bytes.size());
        for (const auto byte : packed.arena_bytes) arena.emplace_back(double(byte));
        packet["arena"] = vf::JsonValue(std::move(arena));
    }
    return vf::JsonValue(std::move(packet));
}

class Reader {
    struct CapturedPoints {
        std::uint32_t payload = 0, count = 0;
        std::array<double, 3> lower{}, upper{};
        std::array<double, 7> tail{};
    };
public:
    Reader(const std::uint8_t* memory, std::size_t size)
        : memory_(memory), size_(size) {}

    vf::JsonValue::Array extract(std::uint32_t output_pointer,
                                 double width, double height) const {
        require_tag(output_pointer, wasm::values::Tag::Array, "UI output root");
        const auto count = u32(output_pointer + wasm::values::length_offset);
        const auto payload = u32(output_pointer + wasm::values::payload_offset);
        range(payload, static_cast<std::size_t>(count) * wasm::values::pointer_size);
        std::size_t displays = 0;
        std::size_t frames = 0;
        std::uint64_t layers = 0;
        vf::JsonValue::Array packets;
        for (std::uint32_t index = 0; index < count; ++index) {
            const auto effect = u32(payload + index * wasm::values::pointer_size);
            if (tag(effect) != wasm::values::Tag::UiEffect) continue;
            const auto values = pointers(effect, "UI effect");
            if (values.empty() || (values.size() & 1U) == 0U) {
                throw std::runtime_error("compiler-owned UI effect payload is malformed");
            }
            const auto kind = string(values[0], "UI effect kind");
            vf::JsonValue::Object properties;
            for (std::size_t operand = 1; operand < values.size(); operand += 2) {
                const auto name = string(values[operand], "UI effect operand name");
                if (!properties.emplace(name, value(values[operand + 1], name)).second) {
                    throw std::runtime_error("duplicate compiler-owned UI effect operand " + name);
                }
            }
            // Retained-scene identity is compiler-private routing metadata, not
            // a legacy geometry operand.
            properties.erase("operation_index");
            properties.erase("display_id");
            if (kind == "display") {
                if (!properties.empty()) throw std::runtime_error("Display runtime effect has unexpected operands");
                ++displays;
            } else if (kind == "add_frame") {
                if (displays == 0) throw std::runtime_error("Display.add_frame ran before Display");
                require_vec2(properties, "pos");
                require_vec2(properties, "size");
                ++frames;
            } else if (kind == "add") {
                if (frames == 0) throw std::runtime_error("Frame.add ran before Display.add_frame");
                auto packet = compiled_geometry::build_u_curve(
                    properties, width, height, 2.0, layers++);
                vf::JsonValue::Array arena;
                arena.reserve(packet.packed.arena_bytes.size());
                for (const auto byte : packet.packed.arena_bytes) arena.emplace_back(static_cast<double>(byte));
                packets.emplace_back(vf::JsonValue::Object{
                    {"metadata", vf::parse_json(packet.packed.metadata_json)},
                    {"arena", vf::JsonValue(std::move(arena))},
                    {"layout", std::move(packet.layout)},
                });
            } else {
                throw std::runtime_error("unsupported compiler-owned UI runtime effect " + kind);
            }
        }
        return packets;
    }

    vf::JsonValue::Array extract_retained(
        std::uint32_t output_pointer,
        const vf::JsonValue& typed_ir,
        PackedArenas* binary_arenas = nullptr,
        double elapsed = 0.0
    ) const {
        if (!std::isfinite(elapsed) || elapsed < 0)
            throw std::runtime_error("Layer elapsed time must be finite and nonnegative");
        const auto& root = typed_ir.as_object();
        const auto program = root.find("ui_program");
        const vf::JsonValue::Array* operations = nullptr;
        if (program != root.end() && program->second.is_object()) {
            const auto operations_value = program->second.as_object().find("operations");
            if (operations_value == program->second.as_object().end()
                || !operations_value->second.is_array()) {
                throw std::runtime_error("compiler-owned retained UI operations are missing");
            }
            operations = &operations_value->second.as_array();
        }
        retained_scene::detail::EvaluationContext evaluation;
        const auto body_entry = root.find("body");
        if (body_entry != root.end() && body_entry->second.is_array()) {
            for (const auto& raw_statement : body_entry->second.as_array()) {
                if (!raw_statement.is_object()) continue;
                const auto& statement = raw_statement.as_object();
                const auto kind_entry = statement.find("kind");
                const auto update_entry = statement.find("update");
                if (kind_entry == statement.end() || !kind_entry->second.is_string() ||
                    kind_entry->second.as_string() != "store_binding" ||
                    (update_entry != statement.end() && update_entry->second.is_boolean() &&
                     update_entry->second.as_boolean())) continue;
                evaluation.bindings[retained_scene::detail::text(
                    statement, "name", "typed IR binding")] =
                    retained_scene::detail::field(statement, "value", "typed IR binding");
            }
        }
        struct View {
            std::string key;
            vf::JsonValue value;
            vf::JsonValue::Array meshes;
            std::optional<std::string> title;
            vf::JsonValue::Object keys;
            vf::JsonValue::Object coordinates;
        };
        struct Frame {
            std::uint32_t id = 0;
            std::vector<double> pos{0.0, 0.0};
            std::vector<double> size{1.0, 1.0};
            vf::JsonValue::Array meshes;
            std::vector<View> views;
            vf::JsonValue::Array lights;
            std::optional<vf::JsonValue> background;
            std::optional<vf::JsonValue> render_options;
            std::optional<vf::JsonValue> camera;
            vf::JsonValue::Object view_properties;
            std::set<char> spatial_axes;
            std::optional<std::string> title;
            std::optional<std::string> toolbar;
            std::string container_kind = "window";
            std::string view_axes;
            std::set<char> view_explicit_keys;
            std::vector<std::map<char, std::size_t>> view_selections;
            bool stacked_views = false;
        };
        std::map<std::uint32_t, Frame> frames;
        vf::JsonValue::Array retained;

        bool shown = false;
        std::optional<std::string> n_label;
        std::map<std::uint32_t, vf::JsonValue::Object> pushed_view_properties;
        std::map<std::uint32_t, std::set<char>> frame_spatial_axes;
        require_tag(output_pointer, wasm::values::Tag::Array, "UI output root");
        const auto count = u32(output_pointer + wasm::values::length_offset);
        const auto payload = u32(output_pointer + wasm::values::payload_offset);
        range(payload, static_cast<std::size_t>(count) * wasm::values::pointer_size);
        // Captured push operands are evaluated exactly once by the VM.
        // Prefer them to declaration evaluation when deriving per-Frame view
        // properties, including limits computed by ordinary source functions.
        std::map<std::size_t, vf::JsonValue::Object> executed_pushes;
        for (std::uint32_t index = 0; index < count; ++index) {
            const auto effect = u32(payload + index * wasm::values::pointer_size);
            if (tag(effect) != wasm::values::Tag::UiEffect) continue;
            const auto values = pointers(effect, "UI effect");
            if (values.empty() || (values.size() & 1U) == 0U)
                throw std::runtime_error("malformed executed retained UI effect");
            if (string(values[0], "UI effect kind") != "push") continue;
            vf::JsonValue::Object arguments;
            for (std::size_t operand = 1; operand < values.size(); operand += 2) {
                const auto name = string(values[operand], "UI effect operand name");
                if (!arguments.emplace(name, value(values[operand+1], name)).second)
                    throw std::runtime_error("duplicate executed push operand");
            }
            const auto identity = arguments.find("operation_index");
            if (identity == arguments.end() || !identity->second.is_number() ||
                !std::isfinite(identity->second.as_number()) || identity->second.as_number()<0 ||
                std::floor(identity->second.as_number())!=identity->second.as_number())
                throw std::runtime_error("invalid executed push identity");
            const auto operation_index=static_cast<std::size_t>(identity->second.as_number());
            arguments.erase(identity);arguments.erase("display_id");
            if (!operations || operation_index>=operations->size() ||
                operations->at(operation_index).as_object().at("kind").as_string()!="push" ||
                !executed_pushes.emplace(operation_index,std::move(arguments)).second)
                throw std::runtime_error("executed push does not match its unique canonical operation");
        }
        if (operations != nullptr) {
            for (const auto& raw_operation : *operations) {
                if (!raw_operation.is_object()) continue;
                const auto& operation = raw_operation.as_object();
                const auto kind_value = operation.find("kind");
                if (kind_value == operation.end() || !kind_value->second.is_string()) continue;
                const std::string operation_kind = kind_value->second.as_string();
                if (operation_kind == "show") {
                    shown = true;
                    const auto raw_properties = operation.find("properties");
                    if (raw_properties != operation.end()) {
                        const auto show_properties =
                            retained_scene::detail::properties(operation, &evaluation);
                        const auto label = show_properties.find("n_label");
                        if (label != show_properties.end() && !label->second.is_string()) {
                            throw std::runtime_error("show n_label must be a string");
                        }
                        if (label != show_properties.end()) n_label = label->second.as_string();
                    }
                    continue;
                }
                if (operation_kind == "add") {
                    continue;
                }
                if (operation_kind != "push") continue;
                const auto frame_value = operation.find("frame_id");
                if (frame_value == operation.end()) continue;
                if (!frame_value->second.is_number() ||
                    frame_value->second.as_number() < 0.0 ||
                    std::floor(frame_value->second.as_number()) != frame_value->second.as_number()) {
                    throw std::runtime_error("canonical Frame.push has no Frame identity");
                }
                pushed_view_properties[static_cast<std::uint32_t>(
                    frame_value->second.as_number())] =
                    (executed_pushes.count(static_cast<std::size_t>(&raw_operation-operations->data()))
                    ? executed_pushes.at(static_cast<std::size_t>(&raw_operation-operations->data()))
                    : retained_scene::detail::properties(operation, &evaluation));
            }
            if (!shown) return retained;
        }

        // Uniform independent points already exist as a validated captured guest
        // array. Keep only its borrowed address until this synchronous formatter
        // call finishes; never expand the data-sized channel into JsonValue.
        // Other material/view/temporal channels retain their ordinary route.
        std::vector<CapturedPoints> captured_points;
        const auto point_operand = [&](const std::vector<std::uint32_t>& values) {
            std::uint32_t position = 0;
            bool color = false;
            std::set<std::string> names;
            if (!operations) return position;
            for (const auto& raw : *operations) {
                const auto& operation = raw.as_object();
                if (operation.at("kind").as_string() == "push" || operation.count("time"))
                    return position;
                const auto properties = operation.find("properties");
                if (properties != operation.end() && properties->second.is_object())
                    for (const auto& property : properties->second.as_object())
                        if (property.first == "n" || property.first.rfind("view_title_", 0) == 0)
                            return position;
            }
            for (std::size_t operand = 1; operand < values.size(); operand += 2) {
                const auto name = string(values[operand], "UI effect operand name");
                if (!names.insert(name).second ||
                    (name != "p_ic" && name != "s" && name != "c" && name != "color" &&
                     name != "id" && name != "operation_index" && name != "display_id"))
                    return std::uint32_t{0};
                if (name == "p_ic") position = values[operand + 1];
                if (name == "color" || name == "c") color = true;
            }
            // Theme/distributed color needs the ordinary materializer's complete
            // domain. This route handles an explicitly authored uniform color.
            if (!color || !position || !names.count("operation_index")) return std::uint32_t{0};
            const auto value_tag = tag(position);
            if (value_tag != wasm::values::Tag::Array && value_tag != wasm::values::Tag::Tuple)
                return std::uint32_t{0};
            const auto length = u32(position + wasm::values::length_offset);
            const auto data = u32(position + wasm::values::payload_offset);
            if (length > size_ / wasm::values::pointer_size)
                throw std::runtime_error("captured point count exceeds guest memory");
            range(data, static_cast<std::size_t>(length) * wasm::values::pointer_size);
            if (!length) return std::uint32_t{0};
            const auto first = u32(data);
            const auto first_tag = tag(first);
            if ((first_tag != wasm::values::Tag::Array && first_tag != wasm::values::Tag::Tuple) ||
                u32(first + wasm::values::length_offset) != 3) return std::uint32_t{0};
            return position;
        };

        // Dimension promotion must follow the values that actually executed. Canonical
        // expressions may contain arbitrary user calls that cannot be replayed here, and
        // replaying them would violate the effect snapshot contract.
        for (std::uint32_t index = 0; index < count; ++index) {
            const auto effect = u32(payload + index * wasm::values::pointer_size);
            if (tag(effect) != wasm::values::Tag::UiEffect) continue;
            const auto values = pointers(effect, "UI effect");
            if (values.empty() || (values.size() & 1U) == 0U ||
                string(values[0], "UI effect kind") != "add") continue;
            vf::JsonValue::Object executed;
            const auto position = point_operand(values);
            for (std::size_t operand = 1; operand < values.size(); operand += 2) {
                const auto name = string(values[operand], "UI effect operand name");
                // Axes depend on row width, not on the number of point rows.
                executed.emplace(name, position && name == "p_ic"
                    ? vf::JsonValue(vf::JsonValue::Array{value(u32(u32(position + wasm::values::payload_offset)), name)})
                    : value(values[operand + 1], name));
            }
            const auto identity = executed.find("operation_index");
            if (identity == executed.end() || !identity->second.is_number()) continue;
            const auto operation_index = static_cast<std::size_t>(identity->second.as_number());
            if (operations == nullptr || operation_index >= operations->size() ||
                !operations->at(operation_index).is_object()) continue;
            const auto& operation = operations->at(operation_index).as_object();
            const auto frame_value = operation.find("frame_id");
            if (frame_value == operation.end() || !frame_value->second.is_number()) continue;
            const auto axes = retained_scene::detail::spatial_property_axes(executed);
            auto& frame_axes = frame_spatial_axes[static_cast<std::uint32_t>(
                frame_value->second.as_number())];
            frame_axes.insert(axes.begin(), axes.end());
        }
        for (std::uint32_t index = 0; index < count; ++index) {
            const auto effect = u32(payload + index * wasm::values::pointer_size);
            if (tag(effect) != wasm::values::Tag::UiEffect) continue;
            const auto values = pointers(effect, "UI effect");
            if (values.empty() || (values.size() & 1U) == 0U) {
                throw std::runtime_error("compiler-owned UI effect payload is malformed");
            }
            const auto kind = string(values[0], "UI effect kind");
            const auto position = kind == "add" ? point_operand(values) : 0;
            std::optional<CapturedPoints> point_data;
            vf::JsonValue::Object properties;
            for (std::size_t operand = 1; operand < values.size(); operand += 2) {
                const auto name = string(values[operand], "UI effect operand name");
                vf::JsonValue decoded;
                if (position && name == "p_ic") {
                    point_data = read_points(position);
                    vf::JsonValue::Array lower, upper;
                    for (std::size_t c = 0; c < 3; ++c) {
                        lower.emplace_back(point_data->lower[c]);
                        upper.emplace_back(point_data->upper[c]);
                    }
                    // The ordinary materializer validates style and computes the
                    // same axis bounds from the complete captured domain bounds.
                    decoded = vf::JsonValue(vf::JsonValue::Array{
                        vf::JsonValue(std::move(lower)), vf::JsonValue(std::move(upper))});
                } else decoded = value(values[operand + 1], name);
                if (!properties.emplace(name, std::move(decoded)).second) {
                    throw std::runtime_error("duplicate compiler-owned UI effect operand " + name);
                }
            }
            if (kind == "native_scene") {
                if (properties.size() != 1 || properties.find("scene") == properties.end()
                    || !properties.at("scene").is_object()) {
                    throw std::runtime_error(
                        "compiler-owned native_scene effect requires one executed scene record");
                }
                auto packed = native_scene::pack_evaluated_scene(
                    properties.at("scene"));
                retained.emplace_back(packed_retained_scene(std::move(packed), binary_arenas));
                continue;
            }
            if (operations == nullptr) {
                throw std::runtime_error(
                    "executed retained UI effect has no canonical operation plan");
            }
            if (kind == "display") continue;
            const auto identity = properties.find("operation_index");
            if (identity == properties.end() || !identity->second.is_number()
                || identity->second.as_number() < 0.0
                || std::floor(identity->second.as_number()) != identity->second.as_number()) {
                throw std::runtime_error("compiler-owned UI effect operation identity is missing");
            }
            const auto operation_index = static_cast<std::size_t>(identity->second.as_number());
            properties.erase(identity);
            if (operation_index >= operations->size() || !operations->at(operation_index).is_object()) {
                throw std::runtime_error("compiler-owned UI effect operation identity is invalid");
            }
            const auto& operation = operations->at(operation_index).as_object();
            const auto operation_kind = operation.find("kind");
            const auto expected_operation_kind = kind == "world_add" ? "add" : kind;
            if (operation_kind == operation.end() || !operation_kind->second.is_string()
                || operation_kind->second.as_string() != expected_operation_kind) {
                throw std::runtime_error("executed UI effect does not match its canonical operation");
            }
            // General World embeddings are ordinary evaluated Add operations.
            // Keep their source relationship through the shared arena instead
            // of synthesizing a separate marker scene or replaying a callable.
            const vf::JsonValue* world_source = nullptr;
            const auto source_value = operation.find("source");
            if (source_value != operation.end() && source_value->second.is_object()) {
                const auto& source = source_value->second.as_object();
                const auto source_kind = source.find("kind");
                if (source_kind != source.end() && source_kind->second.is_string() &&
                    source_kind->second.as_string() == "world_embedding") {
                    const auto source_id = [&](const char* name) {
                        const auto found = source.find(name);
                        if (found == source.end() || !found->second.is_number() ||
                            !std::isfinite(found->second.as_number()) || found->second.as_number() < 0 ||
                            std::floor(found->second.as_number()) != found->second.as_number())
                            throw std::runtime_error("executed World embedding has invalid source identity");
                        return found->second.as_number();
                    };
                    const auto world_id = source_id("world_id");
                    const auto object_id = source_id("object_id");
                    const auto plan = root.find("__vf_internal_world");
                    if (plan == root.end() || !plan->second.is_object())
                        throw std::runtime_error("executed World embedding has no World plan");
                    const auto& world_plan = plan->second.as_object();
                    const auto worlds = world_plan.find("worlds");
                    const auto object_operations = world_plan.find("operations");
                    if (worlds == world_plan.end() || !worlds->second.is_array() ||
                        object_operations == world_plan.end() || !object_operations->second.is_array())
                        throw std::runtime_error("executed World embedding has an invalid World plan");
                    const vf::JsonValue::Object* definition = nullptr;
                    for (const auto& candidate : worlds->second.as_array()) {
                        if (!candidate.is_object()) continue;
                        const auto& fields = candidate.as_object();
                        const auto id = fields.find("id");
                        if (id != fields.end() && id->second.is_number() && id->second.as_number() == world_id) {
                            if (definition) throw std::runtime_error("duplicate World source identity");
                            definition = &fields;
                        }
                    }
                    if (!definition) throw std::runtime_error("executed embedding references an absent World");
                    for (const auto* option : {"em", "gravity", "rigid_collisions"}) {
                        const auto found = definition->find(option);
                        if (found == definition->end() || !found->second.is_boolean() || found->second.as_boolean())
                            throw std::runtime_error("executed World embedding has no compiled law-state binding");
                    }
                    bool matched = false;
                    for (const auto& candidate : object_operations->second.as_array()) {
                        if (!candidate.is_object()) continue;
                        const auto& fields = candidate.as_object();
                        if (fields.count("kind") && fields.at("kind").is_string() && fields.at("kind").as_string() == "add" &&
                            fields.count("world_id") && fields.at("world_id").is_number() && fields.at("world_id").as_number() == world_id &&
                            fields.count("object_id") && fields.at("object_id").is_number() && fields.at("object_id").as_number() == object_id &&
                            source.count("object_type") && fields.count("object_type") &&
                            source.at("object_type").is_string() && fields.at("object_type").is_string() &&
                            source.at("object_type").as_string() == fields.at("object_type").as_string()) {
                            if (matched) throw std::runtime_error("duplicate World Object source identity");
                            matched = true;
                        }
                    }
                    if (!matched) throw std::runtime_error("executed World embedding has no matching owned Object");
                    world_source = &source_value->second;
                }
            }
            if (kind == "world_add" && operation.count("properties")) {
                // The general data-sized point embedding joins its actual
                // Frame, alongside meshes/plots from the other World Objects.
                // These are evaluated channels, not a source interpreter.
                const auto frame_value = operation.find("frame_id");
                const auto layer_value = operation.find("layer_id");
                if (!world_source || frame_value == operation.end() || !frame_value->second.is_number() ||
                    !std::isfinite(frame_value->second.as_number()) || frame_value->second.as_number() < 0 ||
                    std::floor(frame_value->second.as_number()) != frame_value->second.as_number() ||
                    layer_value == operation.end() || !layer_value->second.is_number() ||
                    !std::isfinite(layer_value->second.as_number()) || layer_value->second.as_number() < 0 ||
                    std::floor(layer_value->second.as_number()) != layer_value->second.as_number())
                    throw std::runtime_error("executed World point embedding has no Frame/Layer identity");
                const auto frame = frames.find(static_cast<std::uint32_t>(frame_value->second.as_number()));
                if (frame == frames.end()) throw std::runtime_error("World point embedding ran before its actual Frame");
                const auto layer_id = static_cast<std::uint64_t>(layer_value->second.as_number());
                const auto position_value = properties.find("p_u");
                auto color_value = properties.find("c_uc");
                if (color_value == properties.end()) color_value = properties.find("c_ic");
                const auto size_value = properties.find("s_u");
                const auto mode_value = properties.find("s_mode");
                if (position_value == properties.end() || !position_value->second.is_array() ||
                    position_value->second.as_array().empty() || size_value == properties.end() ||
                    !size_value->second.is_array() || mode_value == properties.end() ||
                    !mode_value->second.is_number() || mode_value->second.as_number() != 0)
                    throw std::runtime_error("World point embedding requires p_up, matching s_u and s_mode:data");
                const auto& positions = position_value->second.as_array();
                if (size_value->second.as_array().size() != positions.size() ||
                    (color_value != properties.end() && (!color_value->second.is_array() ||
                     color_value->second.as_array().size() != positions.size())))
                    throw std::runtime_error("World point embedding channel extents must match");
                auto scalar_color = properties.find("c");
                if (scalar_color == properties.end()) scalar_color = properties.find("color");
                if (color_value == properties.end() && (scalar_color == properties.end() ||
                    !scalar_color->second.is_array() || scalar_color->second.as_array().size() != 4))
                    throw std::runtime_error("World point embedding requires an evaluated RGBA color");
                vf::JsonValue::Array vertices, indices;
                double alpha = 1;
                for (std::size_t i = 0; i < positions.size(); ++i) {
                    const auto& position = positions[i];
                    const auto& color = color_value != properties.end() ? color_value->second.as_array()[i] : scalar_color->second;
                    const auto& size = size_value->second.as_array()[i];
                    if (!position.is_array() || (position.as_array().size() != 2 && position.as_array().size() != 3) ||
                        !color.is_array() || color.as_array().size() != 4 || !size.is_number() ||
                        !std::isfinite(size.as_number()) || !(size.as_number() > 0))
                        throw std::runtime_error("World point embedding has an incompatible evaluated row");
                    const auto& point = position.as_array();
                    for (const auto& component : point) if (!component.is_number() || !std::isfinite(component.as_number()))
                        throw std::runtime_error("World point embedding positions must be finite numbers");
                    for (const auto& component : color.as_array()) if (!component.is_number() ||
                        !std::isfinite(component.as_number()) || component.as_number() < 0 || component.as_number() > 1)
                        throw std::runtime_error("World point embedding RGBA must be in 0..1");
                    vertices.insert(vertices.end(), {point[0], point[1], point.size() == 3 ? point[2] : vf::JsonValue(0.0),
                        vf::JsonValue(0.0), vf::JsonValue(0.0), vf::JsonValue(1.0)});
                    vertices.insert(vertices.end(), color.as_array().begin(), color.as_array().end());
                    indices.emplace_back(static_cast<double>(i));
                    alpha = std::min(alpha, color.as_array()[3].as_number());
                }
                vf::JsonValue mesh(vf::JsonValue::Object{
                    {"type", "field_mesh"}, {"id", retained_scene::detail::mesh_id(properties, layer_id)},
                    {"layer_id", static_cast<double>(layer_id)}, {"topology", "point-list"},
                    {"render_mode", "marker_impostor"}, {"marker_space", "world"},
                    {"mode3d", positions.front().as_array().size() == 3},
                    {"vertices", vf::JsonValue(std::move(vertices))}, {"indices", vf::JsonValue(std::move(indices))},
                    {"vertex_size", 1.0}, {"vertex_scale", size_value->second},
                    {"depth_write", false}, {"no_lighting", true}, {"pickable", true},
                    {"use_vertex_color", true}, {"world_source", *world_source}
                });
                retained_scene::detail::apply_surface_material(mesh.as_object(), properties, alpha);
                if (!properties.count("no_lighting") && !properties.count("receives_lighting"))
                    mesh.as_object()["no_lighting"] = vf::JsonValue(true);
                retained_scene::detail::attach_material_texts(properties, mesh);
                const auto pickable = properties.find("pickable");
                if (pickable != properties.end()) mesh.as_object()["pickable"] = pickable->second;
                frame->second.meshes.emplace_back(std::move(mesh));
                continue;
            }
            if (kind == "world_add") {
                const auto source_value = operation.find("source");
                if (source_value == operation.end() || !source_value->second.is_object()) {
                    throw std::runtime_error("executed World embedding has no canonical source identity");
                }
                const auto& source = source_value->second.as_object();
                const auto identity_number = [&](const char* name) {
                    const auto found = source.find(name);
                    if (found == source.end() || !found->second.is_number()
                        || found->second.as_number() < 0.0
                        || std::floor(found->second.as_number()) != found->second.as_number()) {
                        throw std::runtime_error(
                            std::string("executed World embedding has invalid ") + name);
                    }
                    return static_cast<std::uint64_t>(found->second.as_number());
                };
                const auto world_id = identity_number("world_id");
                const auto object_id = identity_number("object_id");
                const std::string frame_id = "world_" + std::to_string(world_id) + "_view_0";
                const std::string mesh_id = "world_" + std::to_string(world_id) +
                    "_layer_" + std::to_string(object_id);
                const auto world_program = root.find("__vf_internal_world");
                if (world_program == root.end() || !world_program->second.is_object()) {
                    throw std::runtime_error("executed World embedding has no canonical World plan");
                }
                const auto worlds_value = world_program->second.as_object().find("worlds");
                if (worlds_value == world_program->second.as_object().end()
                    || !worlds_value->second.is_array() || worlds_value->second.as_array().size() != 1
                    || !worlds_value->second.as_array()[0].is_object()) {
                    throw std::runtime_error("the first typed World presentation requires one World");
                }
                const auto& world = worlds_value->second.as_array()[0].as_object();
                for (const auto& [name, value] : world) {
                    if (name == "id" || name == "dimension" || name == "em"
                        || name == "gravity" || name == "rigid_collisions") continue;
                    throw std::runtime_error("the first typed World presentation does not support `" +
                        name + "`");
                }
                for (const auto* option : {"em", "gravity", "rigid_collisions"}) {
                    const auto found = world.find(option);
                    if (found == world.end() || !found->second.is_boolean()
                        || found->second.as_boolean()) {
                        throw std::runtime_error(
                            "the first typed World presentation requires `" +
                            std::string(option) + ":false`");
                    }
                }
                const auto require_outer = [&](const char* name, std::size_t width) -> const vf::JsonValue::Array& {
                    const auto found = properties.find(name);
                    if (found == properties.end() || !found->second.is_array()
                        || found->second.as_array().size() != 1
                        || !found->second.as_array()[0].is_array()
                        || found->second.as_array()[0].as_array().size() != width) {
                        throw std::runtime_error(std::string("executed World embedding ") + name +
                            " has an incompatible shape");
                    }
                    return found->second.as_array()[0].as_array();
                };
                const auto& position = require_outer("p_u", 2);
                const auto& color = require_outer("c_uc", 4);
                const auto size_value = properties.find("s_u");
                if (size_value == properties.end() || !size_value->second.is_array()
                    || size_value->second.as_array().size() != 1
                    || !size_value->second.as_array()[0].is_number()) {
                    throw std::runtime_error("executed World embedding s_u has an incompatible shape");
                }
                vf::JsonValue::Array vertices{
                    position[0], position[1], vf::JsonValue(0.0),
                    vf::JsonValue(0.0), vf::JsonValue(0.0), vf::JsonValue(1.0),
                    color[0], color[1], color[2], color[3]};
                vf::JsonValue scene(vf::JsonValue::Object{
                    {"frame", vf::JsonValue(frame_id)},
                    {"meshes", vf::JsonValue(vf::JsonValue::Array{vf::JsonValue(vf::JsonValue::Object{
                        {"type", vf::JsonValue("field_mesh")},
                        {"id", vf::JsonValue(mesh_id)},
                        {"topology", vf::JsonValue("point-list")},
                        {"render_mode", vf::JsonValue("marker_impostor")},
                        {"marker_space", vf::JsonValue("world")},
                        {"mode3d", vf::JsonValue(false)},
                        {"vertices", vf::JsonValue(std::move(vertices))},
                        {"indices", vf::JsonValue(vf::JsonValue::Array{vf::JsonValue(0.0)})},
                        {"vertex_size", size_value->second.as_array()[0]},
                        {"depth_write", vf::JsonValue(false)},
                        {"no_lighting", vf::JsonValue(true)},
                        {"pickable", vf::JsonValue(true)},
                        {"layer_id", vf::JsonValue(0.0)},
                    })})},
                    {"texts", vf::JsonValue(vf::JsonValue::Array{})},
                    {"lights", vf::JsonValue(vf::JsonValue::Array{})},
                });
                auto packed = native_scene::pack_scene_geometry(std::move(scene));
                retained.emplace_back(packed_retained_scene(std::move(packed), binary_arenas));
                continue;
            }
            const auto frame_value = operation.find("frame_id");
            if (frame_value == operation.end() || !frame_value->second.is_number()
                || frame_value->second.as_number() < 0.0
                || std::floor(frame_value->second.as_number()) != frame_value->second.as_number()) {
                throw std::runtime_error("canonical retained UI operation has no Frame identity");
            }
            const auto frame_id = static_cast<std::uint32_t>(frame_value->second.as_number());
            if (kind == "add_frame") {
                Frame next;
                next.id = frame_id;
                next.spatial_axes = frame_spatial_axes[frame_id];
                const auto container_kind = operation.find("container_kind");
                if (container_kind == operation.end()) {
                    next.toolbar = "top";
                } else if (!container_kind->second.is_string()) {
                    throw std::runtime_error("retained container kind must be a string");
                } else {
                    next.container_kind = container_kind->second.as_string();
                    if (next.container_kind != "viewport" && next.container_kind != "window" &&
                        next.container_kind != "panel") {
                        throw std::runtime_error("retained container kind is unsupported");
                    }
                }
                const auto read_pair = [&](const char* name, std::vector<double>& output) {
                    const auto found = operation.find(name);
                    if (found == operation.end()) {
                        throw std::runtime_error(std::string("retained ") + name +
                            " is missing");
                    }
                    const auto value = retained_scene::detail::evaluate(
                        found->second, &evaluation);
                    if (!value.is_array() || value.as_array().size() != 2u ||
                        !value.as_array()[0].is_number() || !value.as_array()[1].is_number()) {
                        throw std::runtime_error(std::string("retained ") + name +
                            " must contain two numbers");
                    }
                    output = {value.as_array()[0].as_number(), value.as_array()[1].as_number()};
                };
                read_pair("pos", next.pos);
                read_pair("size", next.size);
                const auto declared_title = operation.find("title");
                if (declared_title != operation.end()) {
                    const auto value = retained_scene::detail::evaluate(
                        declared_title->second, &evaluation);
                    if (!value.is_string()) {
                        throw std::runtime_error("retained Window title must be a string");
                    }
                    next.title = value.as_string();
                }
                const auto pushed = pushed_view_properties.find(frame_id);
                if (pushed != pushed_view_properties.end()) {
                    next.view_properties = pushed->second;
                    const auto title = next.view_properties.find("title");
                    if (title != next.view_properties.end() && title->second.is_string()) {
                        next.title = title->second.as_string();
                    }
                }
                const auto toolbar = operation.find("toolbar");
                if (toolbar != operation.end()) {
                    const auto value = retained_scene::detail::evaluate(
                        toolbar->second, &evaluation);
                    if (value.is_null()) {
                        next.toolbar.reset();
                    } else if (value.is_string() &&
                        (value.as_string() == "top" || value.as_string() == "right" ||
                         value.as_string() == "bottom" || value.as_string() == "left")) {
                        next.toolbar = value.as_string();
                    } else {
                        throw std::runtime_error(
                            "retained toolbar must be top, right, bottom, left, or null");
                    }
                }
                auto [entry, inserted] = frames.emplace(frame_id, std::move(next));
                if (!inserted) throw std::runtime_error("retained UI Frame was created twice");
                continue;
            }
            const auto frame = frames.find(frame_id);
            if (frame == frames.end()) {
                throw std::runtime_error("retained UI operation ran before Display.add_frame");
            }
            if (kind == "set_geom_options") {
                const auto background = properties.find("background");
                if (background != properties.end()) {
                    retained_scene::detail::normalize_color_property(
                        properties, "background", "Frame.set_geom_options background");
                    frame->second.background = properties.at("background");
                }
                const auto render_options = properties.find("render_options");
                if (render_options != properties.end()) frame->second.render_options = render_options->second;
                continue;
            }
            if (kind == "add_camera") {
                // Match the static camera wire contract used by the canonical
                // scene formatter. These are already evaluated captured operands.
                const auto position = properties.find("p");
                if (position != properties.end()) {
                    properties["pos"] = position->second;
                    properties.erase(position);
                }
                frame->second.camera = operation.find("time") == operation.end()
                    ? vf::JsonValue(properties)
                    : retained_scene::detail::temporal_camera(operation, &evaluation);
                continue;
            }
            if (kind == "add_light") {
                retained_scene::detail::normalize_color_property(
                    properties, "color", "Frame.add_light color");
                frame->second.lights.emplace_back(vf::JsonValue(properties));
                continue;
            }
            if (kind == "push") {
                // This exact evaluated snapshot was consumed by the view
                // prepass before packing its preceding authored geometry.
                if (!executed_pushes.count(operation_index))
                    throw std::runtime_error("executed push snapshot is missing");
                frame->second.view_properties = properties;
                const auto title=properties.find("title");
                if (title!=properties.end()) {
                    if (!title->second.is_string()) throw std::runtime_error("View title must be str");
                    frame->second.title=title->second.as_string();
                }
                continue;
            }
            if (kind != "add") {
                throw std::runtime_error("unsupported executed retained UI operation " + kind);
            }
            for (const auto& [name, value] : frame->second.view_properties) {
                if (name == "title") continue;
                properties.emplace(name, value);
            }
            const auto canonical_properties = operation.find("properties");
            if (canonical_properties == operation.end() || !canonical_properties->second.is_object()) {
                throw std::runtime_error("canonical Frame.add properties are missing");
            }
            const auto layer_value = operation.find("layer_id");
            if (layer_value == operation.end() || !layer_value->second.is_number()
                || layer_value->second.as_number() < 0.0
                || std::floor(layer_value->second.as_number()) != layer_value->second.as_number()) {
                throw std::runtime_error("canonical Frame.add Layer identity is missing");
            }
            const auto layer_id = static_cast<std::uint64_t>(layer_value->second.as_number());
            const auto build_mesh = [&](vf::JsonValue::Object material) {
                auto mesh = retained_scene::detail::material_mesh(
                    material, layer_id, frame->second.spatial_axes);
                if (world_source) mesh.as_object()["world_source"] = *world_source;
                if (point_data) {
                    auto& object = mesh.as_object();
                    if (object.at("topology").as_string() != "point-list")
                        throw std::runtime_error("captured independent point topology differs");
                    const auto& vertices = object.at("vertices").as_array();
                    for (std::size_t c = 0; c < point_data->tail.size(); ++c)
                        point_data->tail[c] = vertices.at(3 + c).as_number();
                    // Canonical layer_id can repeat across executed add effects.
                    // This private token belongs to this exact materialized mesh
                    // and is removed before metadata crosses the packing seam.
                    object["__vkf_captured_points"] = vf::JsonValue(static_cast<double>(captured_points.size()));
                    captured_points.push_back(*point_data);
                    object["vertices"] = vf::JsonValue(vf::JsonValue::Array{});
                    object["indices"] = vf::JsonValue(vf::JsonValue::Array{});
                }
                retained_scene::detail::attach_material_texts(material, mesh);
                const auto legend = material.find("legend");
                if (legend != material.end()) mesh.as_object()["legend"] = legend->second;
                return mesh;
            };
            const auto properties_for_view = [&](const vf::JsonValue::Object& source,
                                                 const std::string& axes,
                                                 const std::map<char, std::size_t>& selected) {
                vf::JsonValue::Object result;
                for (const auto& [name, value] : source) {
                    if (name.rfind("view_title", 0u) == 0u ||
                        (name.size() == 1u && axes.find(name.front()) != std::string::npos)) {
                        continue;
                    }
                    const auto channel = vkf::ui_coordinate::data_channel_name(name);
                    if (!channel.has_value() || name.size() == channel->size()) {
                        result[name] = value;
                        continue;
                    }
                    const std::string value_axes = name.substr(channel->size() + 1u);
                    std::string remaining_axes;
                    for (const char axis : value_axes) {
                        if (selected.find(axis) == selected.end()) remaining_axes.push_back(axis);
                    }
                    result[*channel + (remaining_axes.empty() ? "" : "_" + remaining_axes)] =
                        retained_scene::detail::slice_indexed_value(
                            value, value_axes, 0u, selected, "Viewport.add View data");
                }
                return result;
            };
            auto view_title = std::find_if(
                properties.begin(), properties.end(), [](const auto& property) {
                    return property.first.rfind("view_title_", 0u) == 0u;
                });
            if (view_title != properties.end()) {
                if (!frame->second.views.empty()) {
                    throw std::runtime_error(
                        "View titles may establish a stack only once per Window or Panel");
                }
                const std::string axes = view_title->first.substr(
                    std::string("view_title_").size());
                const auto shape = retained_scene::detail::text_rectangular_shape(
                    view_title->second, "Viewport.add view_title");
                if (axes.empty() || shape.size() != axes.size()) {
                    throw std::runtime_error(
                        "Viewport.add view_title indices must match its title shape");
                }
                frame->second.stacked_views = true;
                frame->second.view_axes = axes;
                std::size_t view_count = 1u;
                for (const auto extent : shape) view_count *= extent;
                for (const char axis : axes) {
                    const auto coordinate = properties.find(std::string(1, axis));
                    if (coordinate != properties.end()) {
                        if (!coordinate->second.is_array() || coordinate->second.as_array().empty()) {
                            throw std::runtime_error(
                                "Viewport.add View coordinate must be a non-empty value");
                        }
                        frame->second.view_explicit_keys.insert(axis);
                    }
                }
                for (std::size_t index = 0; index < view_count; ++index) {
                    std::size_t remainder = index;
                    std::map<char, std::size_t> selected;
                    for (std::size_t reverse = shape.size(); reverse > 0; --reverse) {
                        const std::size_t dimension = reverse - 1u;
                        selected[axes[dimension]] = remainder % shape[dimension];
                        remainder /= shape[dimension];
                    }
                    const auto title = retained_scene::detail::slice_indexed_value(
                        view_title->second, axes, 0u, selected, "Viewport.add view_title");
                    if (!title.is_string()) {
                        throw std::runtime_error("Viewport.add view_title values must be strings");
                    }
                    View view;
                    view.title = title.as_string();
                    for (const char axis : axes) {
                        const auto coordinate = properties.find(std::string(1, axis));
                        view.keys[std::string(1, axis)] = coordinate != properties.end()
                            ? coordinate->second.as_array().at(selected.at(axis))
                            : vf::JsonValue(static_cast<double>(selected.at(axis)));
                    }
                    auto view_properties = properties_for_view(properties, axes, selected);
                    auto mesh = build_mesh(view_properties);
                    retained_scene::detail::merge_view_coordinates(
                        view.coordinates, view.keys, view_properties, mesh);
                    view.meshes.push_back(std::move(mesh));
                    frame->second.view_selections.push_back(std::move(selected));
                    frame->second.views.push_back(std::move(view));
                }
                continue;
            }
            if (frame->second.stacked_views) {
                for (std::size_t index = 0; index < frame->second.views.size(); ++index) {
                    auto selected = frame->second.view_selections[index];
                    for (const char axis : frame->second.view_axes) {
                        if (frame->second.view_explicit_keys.count(axis) == 0u) continue;
                        const auto coordinate = properties.find(std::string(1, axis));
                        if (coordinate == properties.end() || !coordinate->second.is_array()) continue;
                        const auto key = frame->second.views[index].keys.find(std::string(1, axis));
                        if (key == frame->second.views[index].keys.end()) continue;
                        const std::string key_text = vf::json_stringify(key->second, -1);
                        const auto match = std::find_if(
                            coordinate->second.as_array().begin(), coordinate->second.as_array().end(),
                            [&](const auto& candidate) {
                                return vf::json_stringify(candidate, -1) == key_text;
                            });
                        if (match == coordinate->second.as_array().end()) {
                            throw std::runtime_error(
                                "Viewport.add View coordinate does not match an existing View");
                        }
                        selected[axis] = static_cast<std::size_t>(std::distance(
                            coordinate->second.as_array().begin(), match));
                    }
                    auto view_properties = properties_for_view(
                        properties, frame->second.view_axes, selected);
                    auto mesh = build_mesh(view_properties);
                    retained_scene::detail::merge_view_coordinates(
                        frame->second.views[index].coordinates,
                        frame->second.views[index].keys,
                        view_properties,
                        mesh);
                    frame->second.views[index].meshes.push_back(std::move(mesh));
                }
                continue;
            }
            if (operation.find("time") != operation.end()) {
                const auto evaluated = evaluated_temporal_operation(operation, properties);
                auto mesh = retained_scene::detail::temporal_material_mesh_at(
                    evaluated, nullptr, layer_id, frame->second.spatial_axes, elapsed);
                if (world_source) mesh.as_object()["world_source"] = *world_source;
                frame->second.meshes.emplace_back(std::move(mesh));
                continue;
            }
            const auto n_values = properties.find("n");
            if (n_values == properties.end()) {
                frame->second.meshes.emplace_back(build_mesh(std::move(properties)));
                continue;
            }
            if (!n_values->second.is_array() || n_values->second.as_array().empty()) {
                throw std::runtime_error("Frame.add n must be a non-empty vector");
            }
            const auto& view_values = n_values->second.as_array();
            const auto slice_axis = [&](const auto& self, const vf::JsonValue& value,
                                        std::size_t dimension, std::size_t selected) -> vf::JsonValue {
                if (!value.is_array()) {
                    throw std::runtime_error("Frame.add n-distributed data must be rectangular");
                }
                if (dimension == 0) {
                    if (selected >= value.as_array().size()) {
                        throw std::runtime_error("Frame.add n-distributed data length must match n");
                    }
                    return value.as_array()[selected];
                }
                vf::JsonValue::Array result;
                result.reserve(value.as_array().size());
                for (const auto& child : value.as_array()) {
                    result.push_back(self(self, child, dimension - 1, selected));
                }
                return vf::JsonValue(std::move(result));
            };
            const auto value_text = [](const vf::JsonValue& value) {
                if (value.is_string()) return value.as_string();
                if (value.is_number()) return vf::json_stringify(value, -1);
                if (value.is_boolean()) return value.as_boolean() ? std::string("true") : std::string("false");
                return vf::json_stringify(value, -1);
            };
            const auto presentation = [&](const vf::JsonValue& value, std::size_t selected,
                                          const vf::JsonValue& n_value) -> vf::JsonValue {
                if (value.is_array()) {
                    if (value.as_array().size() != view_values.size()) {
                        throw std::runtime_error("Frame.add n presentation list must match n");
                    }
                    return value.as_array()[selected];
                }
                if (!value.is_string()) {
                    throw std::runtime_error("Frame.add n presentation must be a string or string vector");
                }
                std::string result = value.as_string();
                const std::string replacement = value_text(n_value);
                for (std::size_t at = result.find("$n"); at != std::string::npos;
                     at = result.find("$n", at + replacement.size())) {
                    result.replace(at, 2, replacement);
                }
                return vf::JsonValue(std::move(result));
            };
            for (std::size_t selected = 0; selected < view_values.size(); ++selected) {
                vf::JsonValue::Object material;
                for (const auto& [name, value] : properties) {
                    if (name == "n") continue;
                    if (name == "title_n" || name == "legend_n") {
                        material[name.substr(0, name.size() - 2)] =
                            presentation(value, selected, view_values[selected]);
                        continue;
                    }
                    if (name == "text_n") {
                        material["text"] = presentation(
                            value, selected, view_values[selected]);
                        continue;
                    }
                    const auto channel = vkf::ui_coordinate::data_channel_name(name);
                    const auto underscore = channel.has_value()
                        ? name.find('_', channel->size()) : std::string::npos;
                    const std::string axes = underscore == std::string::npos
                        ? std::string{} : name.substr(underscore + 1);
                    const auto n_axis = axes.find('n');
                    if (channel.has_value() && n_axis != std::string::npos) {
                        std::string remaining = axes;
                        remaining.erase(n_axis, 1);
                        const std::string canonical = name.substr(0, underscore) +
                            (remaining.empty() ? "" : "_" + remaining);
                        material[canonical] = slice_axis(slice_axis, value, n_axis, selected);
                    } else {
                        material[name] = value;
                    }
                }
                const std::string key = vf::json_stringify(view_values[selected], -1);
                auto view = std::find_if(frame->second.views.begin(), frame->second.views.end(),
                    [&](const View& candidate) { return candidate.key == key; });
                if (view == frame->second.views.end()) {
                    frame->second.views.push_back(View{key, view_values[selected], {}});
                    view = std::prev(frame->second.views.end());
                }
                const auto title = material.find("title");
                if (title != material.end() && title->second.is_string() && !view->title.has_value()) {
                    view->title = title->second.as_string();
                }
                view->meshes.emplace_back(build_mesh(std::move(material)));
            }
        }

        for (auto& [id, frame] : frames) {
            if (frame.meshes.empty() && frame.views.empty()) continue;
            auto& current_frame = frame;
            const auto emit_scene = [&](std::string frame_name, vf::JsonValue::Array meshes,
                                        std::optional<vf::JsonValue> selector = std::nullopt,
                                        std::optional<std::string> title = std::nullopt,
                                        std::optional<vf::JsonValue::Array> views = std::nullopt) {
                auto texts = retained_scene::detail::extract_material_texts(meshes);
                vf::JsonValue scene(vf::JsonValue::Object{
                    {"frame", vf::JsonValue(std::move(frame_name))},
                    {"container_kind", vf::JsonValue(current_frame.container_kind)},
                    {"pos", vf::JsonValue(vf::JsonValue::Array{
                        vf::JsonValue(current_frame.pos[0]), vf::JsonValue(current_frame.pos[1])})},
                    {"size", vf::JsonValue(vf::JsonValue::Array{
                        vf::JsonValue(current_frame.size[0]), vf::JsonValue(current_frame.size[1])})},
                    {"toolbar", current_frame.toolbar.has_value()
                        ? vf::JsonValue(*current_frame.toolbar) : vf::JsonValue(nullptr)},
                    {"meshes", vf::JsonValue(std::move(meshes))},
                    {"texts", vf::JsonValue(std::move(texts))},
                    {"lights", vf::JsonValue(current_frame.lights)},
                });
                if (current_frame.background) scene.as_object()["background"] = *current_frame.background;
                if (current_frame.render_options) scene.as_object()["render_options"] = *current_frame.render_options;
                if (current_frame.camera) scene.as_object()["camera"] = *current_frame.camera;
                if (selector) scene.as_object()["view_selector"] = std::move(*selector);
                if (views) scene.as_object()["views"] = vf::JsonValue(std::move(*views));
                if (title) scene.as_object()["title"] = vf::JsonValue(*title);
                else if (current_frame.title) scene.as_object()["title"] = vf::JsonValue(*current_frame.title);
                std::map<std::size_t, std::size_t> point_meshes;
                auto& scene_meshes = scene.as_object().at("meshes").as_array();
                for (std::size_t i = 0; i < scene_meshes.size(); ++i) {
                    auto& mesh = scene_meshes[i].as_object();
                    const auto token = mesh.find("__vkf_captured_points");
                    if (token == mesh.end()) continue;
                    point_meshes.emplace(i, static_cast<std::size_t>(token->second.as_number()));
                    mesh.erase(token);
                }
                auto packed = native_scene::pack_scene_geometry(std::move(scene));
                if (!point_meshes.empty()) {
                    auto metadata = vf::parse_json(packed.metadata_json);
                    auto& meshes = metadata.as_object().at("scene").as_object().at("meshes").as_array();
                    for (const auto& [mesh_index, capture_index] : point_meshes)
                        pack_points(packed.arena_bytes, meshes.at(mesh_index).as_object(), captured_points.at(capture_index));
                    packed.metadata_json = vf::json_stringify(metadata, -1);
                }
                retained.emplace_back(packed_retained_scene(std::move(packed), binary_arenas));
            };
            if (frame.views.empty()) {
                emit_scene("frame_" + std::to_string(id), std::move(frame.meshes));
                continue;
            }
            if (frame.stacked_views) {
                vf::JsonValue::Array views;
                for (auto& view : frame.views) {
                    auto texts = retained_scene::detail::extract_material_texts(view.meshes);
                    views.emplace_back(vf::JsonValue::Object{
                        {"title", vf::JsonValue(view.title.value_or(""))},
                        {"keys", vf::JsonValue(std::move(view.keys))},
                        {"coordinates", vf::JsonValue(std::move(view.coordinates))},
                        {"meshes", vf::JsonValue(std::move(view.meshes))},
                        {"texts", vf::JsonValue(std::move(texts))},
                    });
                }
                const auto& first = views.front().as_object();
                emit_scene(
                    "frame_" + std::to_string(id),
                    first.at("meshes").as_array(),
                    std::nullopt,
                    current_frame.title,
                    std::move(views));
                continue;
            }
            for (std::size_t index = 0; index < frame.views.size(); ++index) {
                auto& view = frame.views[index];
                vf::JsonValue::Array meshes = frame.meshes;
                for (auto& mesh : view.meshes) meshes.push_back(std::move(mesh));
                const std::string label = view.title.value_or(
                    view.value.is_string() ? view.value.as_string() :
                    vf::json_stringify(view.value, -1));
                emit_scene(
                    "frame_" + std::to_string(id) + "_n_" + std::to_string(index),
                    std::move(meshes),
                    vf::JsonValue(vf::JsonValue::Object{
                        {"axis", vf::JsonValue("n")}, {"value", view.value},
                        {"label", vf::JsonValue(label)},
                        {"header", n_label
                            ? vf::JsonValue(*n_label) : vf::JsonValue("n")},
                        {"index", vf::JsonValue(static_cast<double>(index))},
                        {"count", vf::JsonValue(static_cast<double>(frame.views.size()))},
                    }),
                    view.title);
            }
        }
        return retained;
    }

private:
    CapturedPoints read_points(std::uint32_t pointer) const {
        CapturedPoints result;
        result.count = u32(pointer + wasm::values::length_offset);
        result.payload = u32(pointer + wasm::values::payload_offset);
        if (result.count > size_ / wasm::values::pointer_size)
            throw std::runtime_error("captured point count exceeds guest memory");
        range(result.payload, static_cast<std::size_t>(result.count) * wasm::values::pointer_size);
        for (std::uint32_t i = 0; i < result.count; ++i) {
            const auto row = u32(result.payload + i * wasm::values::pointer_size);
            const auto row_tag = tag(row);
            if ((row_tag != wasm::values::Tag::Array && row_tag != wasm::values::Tag::Tuple) ||
                u32(row + wasm::values::length_offset) != 3)
                throw std::runtime_error("Frame.add p_ic must contain three-component point rows");
            const auto data = u32(row + wasm::values::payload_offset);
            range(data, 3 * wasm::values::pointer_size);
            for (std::size_t c = 0; c < 3; ++c) {
                const auto v = number(u32(data + c * wasm::values::pointer_size), "Frame.add p_ic");
                if (!i || v < result.lower[c]) result.lower[c] = v;
                if (!i || v > result.upper[c]) result.upper[c] = v;
            }
        }
        return result;
    }

    void pack_points(std::vector<std::uint8_t>& arena, vf::JsonValue::Object& mesh,
                     const CapturedPoints& points) const {
        const auto bytes = static_cast<std::uint64_t>(points.count) * 44;
        if (bytes > std::numeric_limits<std::size_t>::max() - arena.size())
            throw std::runtime_error("captured point arena exceeds address space");
        arena.reserve(arena.size() + static_cast<std::size_t>(bytes));
        const auto vertex_offset = arena.size();
        for (std::uint32_t i = 0; i < points.count; ++i) {
            const auto row = u32(points.payload + i * wasm::values::pointer_size);
            const auto data = u32(row + wasm::values::payload_offset);
            for (std::size_t c = 0; c < 3; ++c)
                native_scene::append_f32(arena, number(u32(data + c * wasm::values::pointer_size), "Frame.add p_ic"));
            for (const auto v : points.tail) native_scene::append_f32(arena, v);
        }
        const auto index_offset = arena.size();
        for (std::uint32_t i = 0; i < points.count; ++i)
            native_scene::append_u32(arena, vf::JsonValue(static_cast<double>(i)));
        const auto reference = [](std::size_t offset, double length, const char* storage) {
            return vf::JsonValue(vf::JsonValue::Object{
                {"byte_offset", static_cast<double>(offset)}, {"length", length}, {"storage", storage}});
        };
        mesh["vertices"] = reference(vertex_offset, static_cast<double>(points.count) * 10, "float32");
        mesh["indices"] = reference(index_offset, points.count, "uint32");
    }

    const std::uint8_t* memory_;
    std::size_t size_;

    void range(std::uint32_t pointer, std::size_t length) const {
        if (pointer > size_ || length > size_ - pointer || (!memory_ && length)) {
            throw std::runtime_error("compiler-owned UI effect addressed invalid WASM memory");
        }
    }

    std::uint32_t u32(std::uint32_t pointer) const {
        range(pointer, 4);
        return static_cast<std::uint32_t>(memory_[pointer]) |
            (static_cast<std::uint32_t>(memory_[pointer + 1]) << 8) |
            (static_cast<std::uint32_t>(memory_[pointer + 2]) << 16) |
            (static_cast<std::uint32_t>(memory_[pointer + 3]) << 24);
    }

    wasm::values::Tag tag(std::uint32_t pointer) const {
        range(pointer, wasm::values::slot_size);
        return static_cast<wasm::values::Tag>(u32(pointer));
    }

    void require_tag(std::uint32_t pointer, wasm::values::Tag expected,
                     const std::string& context) const {
        if (tag(pointer) != expected) throw std::runtime_error(context + " has the wrong runtime value tag");
    }

    std::string string(std::uint32_t pointer, const std::string& context) const {
        require_tag(pointer, wasm::values::Tag::Utf8String, context);
        const auto length = u32(pointer + wasm::values::length_offset);
        const auto payload = u32(pointer + wasm::values::payload_offset);
        range(payload, length);
        return std::string(reinterpret_cast<const char*>(memory_ + payload), length);
    }

    double number(std::uint32_t pointer, const std::string& context) const {
        require_tag(pointer, wasm::values::Tag::Number, context);
        const std::uint64_t bits = static_cast<std::uint64_t>(u32(pointer + 8)) |
            (static_cast<std::uint64_t>(u32(pointer + 12)) << 32);
        double result = 0;
        std::memcpy(&result, &bits, sizeof(result));
        if (!std::isfinite(result)) throw std::runtime_error(context + " must be finite");
        return result;
    }

    std::vector<std::uint32_t> pointers(std::uint32_t pointer,
                                        const std::string& context) const {
        const auto value_tag = tag(pointer);
        if (value_tag != wasm::values::Tag::Array && value_tag != wasm::values::Tag::Tuple
            && value_tag != wasm::values::Tag::UiEffect) {
            throw std::runtime_error(context + " must be an array");
        }
        const auto length = u32(pointer + wasm::values::length_offset);
        const auto payload = u32(pointer + wasm::values::payload_offset);
        range(payload, static_cast<std::size_t>(length) * wasm::values::pointer_size);
        std::vector<std::uint32_t> result;
        result.reserve(length);
        for (std::uint32_t index = 0; index < length; ++index) {
            result.push_back(u32(payload + index * wasm::values::pointer_size));
        }
        return result;
    }

    vf::JsonValue value(std::uint32_t pointer, const std::string& context) const {
        switch (tag(pointer)) {
            case wasm::values::Tag::Null:
                return vf::JsonValue(nullptr);
            case wasm::values::Tag::Boolean:
                return vf::JsonValue(u32(pointer + wasm::values::payload_offset) != 0);
            case wasm::values::Tag::Number:
                return vf::JsonValue(number(pointer, context));
            case wasm::values::Tag::Utf8String:
                return vf::JsonValue(string(pointer, context));
            case wasm::values::Tag::Array:
            case wasm::values::Tag::Tuple: {
                vf::JsonValue::Array result;
                for (const auto child : pointers(pointer, context)) {
                    result.emplace_back(value(child, context));
                }
                return vf::JsonValue(std::move(result));
            }
            case wasm::values::Tag::Record: {
                const auto count = u32(pointer + wasm::values::length_offset);
                const auto payload = u32(pointer + wasm::values::payload_offset);
                range(payload, static_cast<std::size_t>(count) * wasm::values::record_entry_size);
                vf::JsonValue::Object result;
                for (std::uint32_t index = 0; index < count; ++index) {
                    const auto entry = payload + index * wasm::values::record_entry_size;
                    const auto name = string(u32(entry + wasm::values::record_key_offset),
                                             context + " field name");
                    if (!result.emplace(name, value(
                            u32(entry + wasm::values::record_value_offset),
                            context + "." + name)).second) {
                        throw std::runtime_error("duplicate compiler-owned UI operand field " + name);
                    }
                }
                return vf::JsonValue(std::move(result));
            }
            case wasm::values::Tag::Complex: {
                const auto component = [&](std::uint32_t offset) {
                    const std::uint64_t bits = static_cast<std::uint64_t>(u32(pointer + offset)) |
                        (static_cast<std::uint64_t>(u32(pointer + offset + 4)) << 32);
                    double result = 0;
                    std::memcpy(&result, &bits, sizeof(result));
                    if (!std::isfinite(result)) {
                        throw std::runtime_error(context + " must contain finite complex values");
                    }
                    return result;
                };
                return vf::JsonValue(vf::JsonValue::Array{
                    vf::JsonValue(component(8)), vf::JsonValue(component(16))});
            }
            default:
                throw std::runtime_error("unsupported compiler-owned UI operand " + context);
        }
    }

    static void require_vec2(const vf::JsonValue::Object& properties,
                             const std::string& name) {
        const auto found = properties.find(name);
        if (found == properties.end() || !found->second.is_array() ||
            found->second.as_array().size() != 2) {
            throw std::runtime_error("Display.add_frame " + name + " must be a two-value vector");
        }
    }
};

inline vf::JsonValue extract(const std::uint8_t* memory, std::size_t size,
                             std::uint32_t output_pointer,
                             double width, double height) {
    return vf::JsonValue(Reader(memory, size).extract(output_pointer, width, height));
}

inline vf::JsonValue extract_retained(
    const std::uint8_t* memory,
    std::size_t size,
    std::uint32_t output_pointer,
    const vf::JsonValue& typed_ir
) {
    return vf::JsonValue(Reader(memory, size).extract_retained(output_pointer, typed_ir));
}

inline vf::JsonValue extract_retained_binary(
    const std::uint8_t* memory,
    std::size_t size,
    std::uint32_t output_pointer,
    const vf::JsonValue& typed_ir,
    PackedArenas& binary_arenas,
    double elapsed = 0.0
) {
    binary_arenas.clear();
    try {
        return vf::JsonValue(Reader(memory, size).extract_retained(
            output_pointer, typed_ir, &binary_arenas, elapsed));
    } catch (...) {
        binary_arenas.clear();
        throw;
    }
}

} // namespace vkf::ui_effect_packets
