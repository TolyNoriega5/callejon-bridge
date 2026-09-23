// Host this file and backend-bridge.html outside Neocities, on an origin YOU control.
(() => {
  const config = window.CALLEJON_CONFIG || {};
  const allowed = new Set(config.allowedParentOrigins || []);
  let backend;
  try { backend = new URL(config.supabaseUrl); } catch { return; }
  window.addEventListener("message", async event => {
    if (event.source !== parent || !allowed.has(event.origin)) return;
    const data = event.data;
    if (!data || data.type !== "callejon-fetch" || typeof data.id !== "string") return;
    const reply = result => event.source.postMessage({type:"callejon-fetch-result",id:data.id,...result},event.origin);
    try {
      const url = new URL(data.url);
      if (url.origin !== backend.origin || !/^\/(auth|rest|storage)\/v1\//.test(url.pathname)) throw new Error("Invalid endpoint");
      if (!["GET","POST","PATCH","PUT","DELETE","HEAD"].includes(data.method)) throw new Error("Invalid method");
      if (data.body && data.body.byteLength > 6 * 1024 * 1024) throw new Error("Request too large");
      const headers = new Headers();
      for (const [key,value] of data.headers || []) {
        if (["authorization","apikey","content-type","prefer","range","range-unit","accept","x-client-info","x-supabase-api-version","x-upsert","cache-control"].includes(key.toLowerCase())) headers.set(key,value);
      }
      const response = await fetch(url.href,{method:data.method,headers,body:["GET","HEAD"].includes(data.method) ? undefined : data.body,credentials:"omit",redirect:"error",signal:AbortSignal.timeout(25000)});
      reply({status:response.status,headers:[...response.headers],body:await response.text()});
    } catch { reply({error:"Backend request failed"}); }
  });
})();
