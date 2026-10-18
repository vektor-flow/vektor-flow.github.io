"""Independent SciPy cubic oracle and encoded-video checks; not runtime code."""
from pathlib import Path
import hashlib,json,subprocess,sys
import numpy as np
from scipy.interpolate import CubicSpline
root=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/vkf-text-unfold')
report={'passed':False,'modes':{}}
for name in ['letters','words']:
    clip=json.loads((root/(name+'.json')).read_text())
    groups=len(clip['groups']);frames=clip['frames']
    knots=np.arange(groups+4,dtype=float)
    states=np.zeros((groups+4,groups,4))
    for g in range(groups):
        states[:g+1,g]=[-.3,.8,0,0]
        states[g+1,g]=[.04,-.16,.84,1.2]
        states[g+2:,g]=[0,0,1,1]
    q=np.clip((np.linspace(0,12,frames)-.5)/9.5*(groups+1),0,groups+3)
    mapped=q.copy()
    first=q<1
    mapped[first]=6*q[first]**3-8*q[first]**4+3*q[first]**5
    last=q>groups+2
    z=groups+3-q[last]
    mapped[last]=groups+3-(6*z**3-8*z**4+3*z**5)
    expected=CubicSpline(knots,states,axis=0,bc_type='natural')(mapped)
    for g in range(groups):
        expected[q<=g,g,2:]=0
        expected[q>=g+3,g]=[0,0,1,1]
    expected[:,:,2:]=np.maximum(expected[:,:,2:],0)
    actual=np.array(clip['values']).reshape(frames,groups,4)
    error=float(np.max(np.abs(expected-actual)))
    assert error<.00001,(name,error) # Native diagnostic vector serialization.
    assert not np.any(actual[0,:,2:])
    assert np.array_equal(actual[-1],np.tile([0,0,1,1],(groups,1)))
    assert np.all(np.isfinite(actual)) and np.min(actual[:,:,2:])>=0
    checks={'groups':groups,'scalarComparisons':int(actual.size),'maxOracleError':error}
    for extension in ['webm','mp4']:
        video=root/(name+'.'+extension)
        if not video.exists():continue
        metadata=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=width,height,r_frame_rate,nb_read_frames,codec_name:format=duration','-of','json',str(video)]))
        stream=metadata['streams'][0]
        assert (stream['width'],stream['height'],stream['r_frame_rate'],stream['nb_read_frames'])==(1920,1080,'60/1','720'),metadata
        assert abs(float(metadata['format']['duration'])-12)<.05,metadata
        checks[extension]=metadata
    report['modes'][name]=checks
assert (root/'letters-719.png').read_bytes()==(root/'words-719.png').read_bytes()
report.update(passed=True,identicalFinalPixels=True,physicalGPUExecuted=False)
(root/'numeric-video-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
