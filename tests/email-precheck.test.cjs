const {test}=require('node:test');const assert=require('node:assert/strict');const{readFileSync}=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
function harness({key='',reply,fetchError,mxError=false,timeoutFast=false}={}){
const calls=[];const dns=[];const timeouts=[];const mod={exports:{}};
const source=ts.transpileModule(readFileSync('server/src/lib/email-precheck.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(source,{exports:mod.exports,module:mod,require:id=>id==='node:dns/promises'?{resolveMx:async domain=>{dns.push(domain);if(mxError)throw Error('DNS');return[{exchange:'mx.synthetic.invalid'}]}}:{getServerEnv:()=>({emailVerifierApiKey:key})},URL,AbortSignal:timeoutFast?{timeout:ms=>{timeouts.push(ms);const c=new AbortController();setTimeout(()=>c.abort(),5);return c.signal}}:AbortSignal,Uint8Array,TextDecoder,Date,fetch:async(url,options)=>{calls.push({url:String(url),options});if(timeoutFast)return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('SYNTHETIC_ABORT_SECRET')),{once:true}));if(fetchError)throw Error(fetchError);return reply??new Response(JSON.stringify({emailAddress:'test@example.invalid',validFormat:'OK',dns:'OK',disposable:'false',mxs:['mx.synthetic.invalid']}),{status:200})}});
return{run:mod.exports.runEmailPrecheck,calls,dns,timeouts};}
test('missing key does not call provider',async()=>{const h=harness();const r=await h.run(' TEST@example.invalid ');assert.equal(r.provider,'local-fallback');assert.equal(r.status,'limited');assert.equal(h.calls.length,0);assert.deepEqual(h.dns,['example.invalid'])});
test('valid provider response preserves signal and privacy flags',async()=>{const h=harness({key:'SYNTHETIC_KEY_NOT_REAL'});const r=await h.run('test@example.invalid');assert.equal(r.status,'ok');assert.equal(r.provider,'email-verifier');const c=h.calls[0];const u=new URL(c.url);assert.equal(u.origin,'https://emailverification.whoisxmlapi.com');assert.equal(u.pathname,'/api/v1');assert.equal(u.searchParams.get('apiKey'),'SYNTHETIC_KEY_NOT_REAL');for(const k of ['validateSMTP','checkCatchAll','checkFree'])assert.equal(u.searchParams.get(k),'false');for(const k of ['validateDNS','checkDisposable'])assert.equal(u.searchParams.get(k),'true');assert.equal(u.searchParams.get('outputFormat'),'json');assert.equal(c.options.redirect,'error');assert.ok(c.options.signal)});
test('untrusted email does not select destination',async()=>{const h=harness({key:'SYNTHETIC'});await h.run('a@evil.invalid/?redirect=https://evil.invalid');assert.equal(new URL(h.calls[0].url).origin,'https://emailverification.whoisxmlapi.com')});
for(const [name,opts] of [
 ['network failure',{fetchError:'SECRET_KEY PRIVATE_EMAIL INTERNAL_STACK'}],
 ['non-200',{reply:new Response('SECRET_KEY',{status:500})}],
 ['redirect',{reply:new Response(null,{status:302,headers:{location:'https://evil.invalid'}})}],
 ['malformed JSON',{reply:new Response('SECRET_KEY')}],
 ['provider error',{reply:new Response(JSON.stringify({ErrorMessage:{msg:'SECRET_KEY'}}))}],
 ['missing email',{reply:new Response('{}')}],
 ['mismatched email',{reply:new Response(JSON.stringify({emailAddress:'other@example.invalid'}))}],
 ['oversized response',{reply:new Response('x'.repeat(32769))}],
 ['array response',{reply:new Response('[]')}],
 ['null response',{reply:new Response('null')}],
])test(name+' safely falls back without disclosing provider errors',async()=>{const h=harness({key:'SYNTHETIC',...opts});const r=await h.run('test@example.invalid');assert.equal(r.provider,'local-fallback');assert.equal(r.providerError,'email_verifier_unavailable');assert.ok(!JSON.stringify(r).includes('SECRET_KEY'));assert.equal(h.calls.length,1)});
test('invalid local email does not query DNS or provider',async()=>{const h=harness();const r=await h.run('invalid');assert.equal(r.status,'invalid');assert.equal(h.calls.length,0);assert.equal(h.dns.length,0)});
test('local DNS failure flags review',async()=>{const h=harness({mxError:true});assert.equal((await h.run('test@example.invalid')).status,'review')});

test('timeout configured at 5000ms and abort safely falls back',async()=>{const h=harness({key:'SYNTHETIC',timeoutFast:true});const r=await h.run('test@example.invalid');assert.deepEqual(h.timeouts,[5000]);assert.equal(h.calls.length,1);assert.equal(r.provider,'local-fallback');assert.equal(r.providerError,'email_verifier_unavailable');assert.ok(!JSON.stringify(r).includes('ABORT_SECRET'))});
