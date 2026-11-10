import { FFmpeg } from '@ffmpeg/ffmpeg';
import { momentCard, momentThemes, INTRO_SECONDS, OUTRO_SECONDS } from './moment-design.mjs';

type Clip = { file: File; start: number; end: number };
export async function renderVideo(clips: Clip[], design: any) {
  if (!Array.isArray(clips) || !clips.length || clips.length > 12) throw new Error('1~12개 영상을 선택해주세요.');
  if (clips.some(c => !(c.file instanceof File)) || clips.reduce((sum, c) => sum + c.file.size, 0) > 250 * 1024 * 1024) throw new Error('파일 크기 합계는 250MB 이하여야 합니다.');
  const total = clips.reduce((sum, c) => sum + c.end - c.start, 0);
  if (clips.some(c => !Number.isFinite(c.start) || !Number.isFinite(c.end) || c.start < 0 || c.end - c.start < 0.1) || !Number.isFinite(total) || total > 60 - INTRO_SECONDS - OUTRO_SECONDS + 0.001) throw new Error('각 컷은 0.1초 이상, 원본 컷 합계는 55초 이하여야 합니다.');
  if (!design || !momentThemes.some((theme: { id: string }) => theme.id === (design.theme || 'sage'))) throw new Error('디자인 필터를 다시 선택해주세요.');
  const ff = new FFmpeg();
  let coreBlob = '';
  let wasmBlob = '';
  const run = async (args: string[]) => {
    const code = await ff.exec(args);
    if (code !== 0) throw new Error('영상 변환에 실패했어요. 다른 MP4 영상으로 다시 시도해주세요.');
  };
  try {
    const parts = await Promise.all(['aa','ab','ac','ad'].map(async suffix => {
      const r = await fetch(`/ffmpeg/core.wasm.part-${suffix}`);
      if (!r.ok) throw new Error('영상 변환 도구를 불러오지 못했어요.');
      return r.arrayBuffer();
    }));
    const coreResponse = await fetch('/ffmpeg/core.js');
    if (!coreResponse.ok) throw new Error('영상 변환 도구를 불러오지 못했어요.');
    coreBlob = URL.createObjectURL(new Blob([await coreResponse.text()], {type:'text/javascript'}));
    wasmBlob = URL.createObjectURL(new Blob(parts, {type:'application/wasm'}));
    await ff.load({coreURL:coreBlob, wasmURL:wasmBlob});
    for (let i=0; i<clips.length; i++) {
      const input = `input-${i}`;
      await ff.writeFile(input, new Uint8Array(await clips[i].file.arrayBuffer()));
      let hasAudio = false;
      const listen = ({message}: {message:string}) => { if (/Audio:/.test(message)) hasAudio = true; };
      ff.on('log', listen);
      await ff.exec(['-i', input]);
      ff.off('log', listen);
      const args = ['-y','-ss',String(clips[i].start),'-i',input];
      if (!hasAudio) args.push('-f','lavfi','-i','anullsrc=channel_layout=stereo:sample_rate=44100');
      args.push('-t',String(clips[i].end-clips[i].start),'-map','0:v:0','-map',hasAudio?'0:a:0':'1:a:0','-vf','scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=0x141c18,setsar=1,fps=30','-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-ar','44100','-ac','2','-af','apad','-video_track_timescale','90000',`cut-${i}.mp4`);
      await run(args);
      await ff.deleteFile(input);
    }
    const canvas = document.createElement('canvas'); canvas.width=720; canvas.height=1280;
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('이 브라우저에서 영상 합성을 지원하지 않아요.');
    for (const [kind,duration] of [['intro',3],['outro',2]] as const) {
      for (let frame=0; frame<duration*10; frame++) {
        const url=URL.createObjectURL(new Blob([momentCard({...design,kind,time:frame/10})],{type:'image/svg+xml'}));
        try {
          const img = new Image();
          await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve(); img.onerror=()=>reject(new Error('영상 디자인 생성 실패')); img.src=url;});
          ctx.clearRect(0,0,720,1280); ctx.drawImage(img,0,0);
          const blob = await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('영상 디자인 생성 실패')),'image/png'));
          await ff.writeFile(`${kind}-${String(frame).padStart(3,'0')}.png`,new Uint8Array(await blob.arrayBuffer()));
        } finally { URL.revokeObjectURL(url); }
      }
      await run(['-y','-stream_loop','-1','-i',`cut-${kind==='intro'?0:clips.length-1}.mp4`,'-framerate','10','-i',`${kind}-%03d.png`,'-f','lavfi','-i','anullsrc=channel_layout=stereo:sample_rate=44100','-t',String(duration),'-filter_complex',`[0:v]setsar=1[film];[film][1:v]overlay=0:0:shortest=1[v]`,'-map','[v]','-map','2:a:0','-r','30','-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-ar','44100','-ac','2','-video_track_timescale','90000',`${kind}.mp4`]);
      for(let frame=0;frame<duration*10;frame++) await ff.deleteFile(`${kind}-${String(frame).padStart(3,'0')}.png`);
    }
    await ff.writeFile('list.txt',new TextEncoder().encode(["file 'intro.mp4'",...clips.map((_,i)=>`file 'cut-${i}.mp4'`),"file 'outro.mp4'"].join('\n')));
    await run(['-y','-f','concat','-safe','0','-i','list.txt','-t','60','-c','copy','-movflags','+faststart','result.mp4']);
    const result = await ff.readFile('result.mp4');
    if (typeof result === 'string') throw new Error('영상 결과를 읽을 수 없어요.');
    return new Blob([new Uint8Array(result)],{type:'video/mp4'});
  } finally { ff.terminate(); if(coreBlob) URL.revokeObjectURL(coreBlob); if(wasmBlob) URL.revokeObjectURL(wasmBlob); }
}
