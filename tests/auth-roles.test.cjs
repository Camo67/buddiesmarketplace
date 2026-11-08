const {test}=require('node:test');const assert=require('node:assert/strict');const{readFileSync}=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
function load(env={}){const output=ts.transpileModule(readFileSync('lib/supabase-auth.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const mod={exports:{}};vm.runInNewContext(output,{exports:mod.exports,module:mod,require:()=>({createClient:()=>{throw Error('No live auth allowed in fixture')}}),process:{env}});return mod.exports}
const fixture=(user={},app={},email='synthetic@example.invalid')=>({id:'synthetic',email,user_metadata:user,app_metadata:app});
test('user editable default admin role cannot grant admin',()=>{const m=load();assert.equal(m.hasSupabaseAdminAccess(fixture({roles:['buddies-admin']})),false)});
test('user editable configured role cannot grant admin',()=>{const m=load({SUPABASE_ADMIN_ROLE:'operator'});assert.equal(m.hasSupabaseAdminAccess(fixture({roles:['operator']})),false)});
test('trusted app metadata role still grants admin',()=>{const m=load();assert.equal(m.hasSupabaseAdminAccess(fixture({}, {roles:['buddies-admin']})),true)});
test('trusted configured role still grants admin',()=>{const m=load({SUPABASE_ADMIN_ROLE:'operator'});assert.equal(m.hasSupabaseAdminAccess(fixture({}, {roles:['operator']})),true)});
test('server configured email grant preserved',()=>{const m=load({SUPABASE_ADMIN_EMAILS:'owner@synthetic.invalid'});assert.equal(m.hasSupabaseAdminAccess(fixture({}, {},'owner@synthetic.invalid')),true)});
test('no grants means no admin',()=>{assert.equal(load().hasSupabaseAdminAccess(fixture()),false)});
test('other app roles not admin',()=>{assert.equal(load().hasSupabaseAdminAccess(fixture({}, {roles:['viewer']})),false)});
test('malformed user roles never grant admin',()=>{for(const roles of ['buddies-admin',null,{},[null,1,'buddies-admin']])assert.equal(load().hasSupabaseAdminAccess(fixture({roles})),false)});
test('role return ignores all user role data',()=>{const m=load();assert.equal(JSON.stringify(m.getSupabaseUserRoles(fixture({roles:['buddies-admin','arbitrary']},{roles:['viewer']}))),JSON.stringify(['viewer']))});
