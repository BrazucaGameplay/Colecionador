export function getDirectionalAtlasLayouts(records,frameSize,maxTextureSize=2048){
 if(!Array.isArray(records)||!records.length||!Number.isInteger(frameSize?.width)||!Number.isInteger(frameSize?.height)||frameSize.width<=0||frameSize.height<=0)throw new TypeError('Metadados de atlas inválidos.');
 const groups=new Map();
 for(const frame of records){const d=Number(frame.direction);if(!Number.isInteger(d)||d<0||!Number.isInteger(frame.frame)||frame.frame<0||![frame.x,frame.y,frame.width,frame.height].every(Number.isFinite)||frame.width!==frameSize.width||frame.height!==frameSize.height)throw new TypeError('Quadro direcional inválido.');if(!groups.has(d))groups.set(d,[]);groups.get(d).push(frame);}
 return [...groups.entries()].sort((a,b)=>a[0]-b[0]).map(([direction,frames])=>{frames.sort((a,b)=>a.frame-b.frame);const columns=Math.ceil(Math.sqrt(frames.length)),rows=Math.ceil(frames.length/columns),width=columns*frameSize.width,height=rows*frameSize.height;if(width>maxTextureSize||height>maxTextureSize)throw new RangeError(`Página direcional excede ${maxTextureSize}px: ${width}x${height}.`);return{direction,frames,columns,rows,width,height};});
}
