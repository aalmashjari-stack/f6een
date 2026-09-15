import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest'
import {ALL_QUESTIONS,allQuestions,playableCategories,setQuestionOverlay,setBlockedQuestionIds,familiesOf,poolShippedByLevels} from './game/bank'
import {createSession,encodeState,isStoredState,persistUsedIds,loadUsedIds,STAGE1_LEVELS,stageOfPhase} from './game/session'
import {reducer} from './game/reducer'
import {drawOne,drawStage3Queue} from './game/draw'
import {buildPlan,parseCsv,questionsToCsv} from './lib/importQuestions'
const api=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn(),uid:'00000000-0000-0000-0000-000000000001'}))
vi.mock('./lib/supabase',()=>({supabase:api}))
vi.mock('./lib/auth',()=>({currentUserId:async()=>api.uid}))
import {syncUsedIds} from './lib/usedQuestions'
import {importQuestions} from './lib/admin'
import {reportQuestion} from './lib/questionFlags'
const store=new Map<string,string>()
beforeEach(()=>{store.clear();vi.stubGlobal('localStorage',{getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v),removeItem:(k:string)=>store.delete(k)});setQuestionOverlay([]);setBlockedQuestionIds([]);api.rpc.mockReset();api.from.mockReset()})
afterEach(()=>vi.unstubAllGlobals())
const input=()=>({teamNames:['A','B'] as [string,string],players:[['a','b'],['c','d']] as [string[],string[]],startingTeam:0 as const,categories:playableCategories().slice(0,6)})
const step=(s:any,a:any)=>reducer(s,a)!
describe('audit expected behavior: recovery, selection and boundaries',()=>{
 it('rejects a question-phase snapshot without its question',()=>{const s=encodeState(createSession(input()));s.phase='stage2-question';s.currentQuestion=null;s.s2Sel=null;expect(isStoredState(s)).toBe(false)})
 it('rejects a snapshot with malformed player records',()=>{const s=encodeState(createSession(input()));(s.teams[0].players as any)=[null];expect(isStoredState(s)).toBe(false)})
 it('rejects malformed score buckets',()=>{const s=encodeState(createSession(input()));(s.stagePoints.s1 as any)=[];expect(isStoredState(s)).toBe(false)})
 it('builds a usable sprint queue after historical exhaustion',()=>{expect(drawStage3Queue(40,new Set(ALL_QUESTIONS.map(q=>q.id))).length).toBeGreaterThan(0)})
 it('never draws from an already-spent family under scarcity',()=>{const q=ALL_QUESTIONS.find(q=>familiesOf(q).length)!;const fam=familiesOf(q);setBlockedQuestionIds(ALL_QUESTIONS.filter(x=>x.id!==q.id).map(x=>x.id));let result:any;try{result=drawOne(q.category,q.level,new Set(),new Set(),new Set(fam))}catch{return}expect(familiesOf(result).some(f=>fam.includes(f))).toBe(false)})
 it('keeps queued sprint reservations when a board cell has one eligible question',()=>{const q=ALL_QUESTIONS.find(q=>q.level==='سهل')!;setBlockedQuestionIds(ALL_QUESTIONS.filter(x=>x.id!==q.id).map(x=>x.id));let result:any;try{result=drawOne(q.category,q.level,new Set(),new Set([q.id]))}catch{return}expect(result.id).not.toBe(q.id)})
 it('does not apply a stale end-turn action twice',()=>{let s:any={...createSession(input()),phase:'stage3-play'};s=step(s,{t:'S3_END_TURN'});expect(step(s,{t:'S3_END_TURN'})).toEqual(s)})
 it('ignores a reveal event outside stage 1',()=>{const s:any={...createSession(input()),phase:'endgame'};expect(step(s,{t:'S1_TO_REVEAL'})).toEqual(s)})
 it('ignores a tiebreak scoring event outside tiebreak',()=>{const s=createSession(input());expect(step(s,{t:'TIEBREAK_PICK',team:0})).toEqual(s)})
 it('rejects a category that was not selected for the board',()=>{const s=createSession(input());const cat=playableCategories().find(c=>!s.s1Categories.some(x=>x.name===c))!;expect(step(s,{t:'S1_PICK',category:cat,level:'سهل'})).toEqual(s)})
 it('preserves complete photo-question CSV round trips',()=>{const qs=ALL_QUESTIONS.filter(q=>q.image&&q.question==='من صاحب الصورة؟');const p=buildPlan(parseCsv(questionsToCsv(qs)),{categories:playableCategories(),existing:ALL_QUESTIONS});expect(p.rows.length).toBe(qs.length)})
 it('does not merge account A history into account B',async()=>{persistUsedIds(new Set(['A-private-history']));const writes:any[]=[];api.from.mockImplementation(()=>({select:()=>({eq:async()=>({data:[],error:null})}),upsert:async(rows:any)=>{writes.push(...rows);return {error:null}}}));await syncUsedIds('account-B');expect(writes.some(x=>x.question_id==='A-private-history')).toBe(false)})
 it('preserves history learned locally while initial synchronization is pending',async()=>{let release:any;api.from.mockImplementation(()=>({select:()=>({eq:()=>new Promise(r=>release=r)}),upsert:async()=>({error:null})}));const pending=syncUsedIds(api.uid);await Promise.resolve();persistUsedIds(new Set(['just-shown']));release({data:[{question_id:'server-old'}],error:null});await pending;expect(loadUsedIds().has('just-shown')).toBe(true)})
 it('blocks a reported question locally even when the network fails',async()=>{const q=ALL_QUESTIONS[0];api.rpc.mockResolvedValue({error:new Error('offline')});await reportQuestion(q.id).catch(()=>{});expect(JSON.parse(store.get('f6een.blockedQuestionIds')??'[]')).toContain(q.id)})
 it('does not duplicate successful import batches when retrying',async()=>{let calls=0;let persisted=0;api.rpc.mockImplementation(async()=>{calls++;if(calls===2)return {error:{message:'offline'}};persisted+=300;return {data:{added:300,updated:0},error:null}});const rows=Array.from({length:600},(_,i)=>({id:null,category:'C',level:'سهل' as const,topic:'',question:'Q'+i,answer:'A',image:null}));await importQuestions(rows).catch(()=>{});await importQuestions(rows);expect(persisted).toBe(600)})
})
describe('audit positive controls',()=>{
 it('valid initial snapshot survives serialization',()=>{const s=createSession(input());expect(isStoredState(JSON.parse(JSON.stringify(encodeState(s))))).toBe(true)})
 it('unused and unblocked initial sprint queue is unique',()=>{const qs=drawStage3Queue(40,new Set());expect(qs.length).toBe(40);expect(new Set(qs.map(q=>q.id)).size).toBe(qs.length)})
 it('textual CSV round trip works',()=>{const qs=ALL_QUESTIONS.filter(q=>!q.image).slice(0,10);const p=buildPlan(parseCsv(questionsToCsv(qs)),{categories:playableCategories(),existing:qs});expect(p.rows.length).toBe(10)})
 it('normal duplicate text import is rejected',()=>{const q=ALL_QUESTIONS.find(q=>!q.image)!;const p=buildPlan([['التصنيف','المستوى','السؤال','الإجابة'],[q.category,q.level,q.question,q.answer]],{categories:playableCategories(),existing:[q]});expect(p.rows.length).toBe(0)})
 it('concurrent-session reducer inputs remain unmodified',()=>{const s=createSession(input());const snap=JSON.stringify(encodeState(s));step(s,{t:'S1_PICK',category:s.s1Categories[0].name,level:'سهل'});expect(JSON.stringify(encodeState(s))).toBe(snap)})
 it('all team-size combinations complete a full reducer session',()=>{for(let n=2;n<=6;n++)for(let m=2;m<=6;m++){const cfg=input();cfg.players=[Array.from({length:n},(_,i)=>'a'+i),Array.from({length:m},(_,i)=>'b'+i)];let s=createSession(cfg);const shown:string[]=[];for(const c of s.s1Categories)for(const level of STAGE1_LEVELS){s=step(s,{t:'S1_PICK',category:c.name,level});shown.push(s.currentQuestion!.id);s=step(s,{t:'S1_TO_REVEAL'});s=step(s,{t:'S1_SCORE',team:0})}s=step(s,{t:'INTERVAL_CONTINUE'});while(s.phase==='stage2-selection'){s=step(s,{t:'S2_SELECT',sel:[s.s2Rem[0][0],s.s2Rem[1][0]]});shown.push(s.currentQuestion!.id);s=step(s,{t:'S2_TO_REVEAL'});s=step(s,{t:'S2_NEXT_ROUND'})}s=step(s,{t:'INTERVAL_CONTINUE'});for(let t=0;t<2;t++){for(let k=0;k<14;k++){shown.push(s.s3Queue[s.s3Pos].id);s=step(s,{t:'S3_REVEAL'});s=step(s,{t:'S3_JUDGE',verdict:'correct'})}shown.push(s.s3Queue[s.s3Pos].id);s=step(s,{t:'S3_END_TURN'})}expect(s.phase).toBe('endgame');expect(new Set(shown).size).toBe(shown.length);for(let t=0;t<2;t++)expect(Object.values(s.stagePoints).reduce((sum,v)=>sum+v[t],0)).toBe(s.teams[t].score)}})
})
