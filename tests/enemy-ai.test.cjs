const {test}=require('node:test'),assert=require('node:assert/strict');
require('../js/enemy-ai.js');
function enemy(id,x=0,z=0,extra={}){
 return {id,homeX:x,homeZ:z,attack:3,mesh:{visible:true,position:{x,z}},...extra};
}
test('distinct behavior profiles and visibility-independent alert',()=>{
 const wolf=enemy('w1'),guard=enemy('g1',0,0,{shield:true}),spirit=enemy('s1',0,0,{spirit:true}),boss=enemy('boss',0,0,{boss:true});
 assert.equal(EmberEnemyAI.type(wolf),'wolf');
 assert.equal(EmberEnemyAI.type(guard),'guardian');
 assert.equal(EmberEnemyAI.type(spirit),'spirit');
 assert.equal(EmberEnemyAI.type(boss),'boss');
 assert.notEqual(EmberEnemyAI.config(guard).windup,EmberEnemyAI.config(wolf).windup);
 assert.equal(EmberEnemyAI.active(wolf,0,18),false);
 EmberEnemyAI.notifyHit(wolf,[wolf],0,18);
 assert.equal(EmberEnemyAI.active(wolf,0,18),true);
 EmberEnemyAI.tick(wolf,10.1);
 assert.equal(EmberEnemyAI.active(wolf,0,18),false);
});
test('wounded wolves alert nearby allies but not remote monsters or bosses',()=>{
 const wolf=enemy('w1'),ally=enemy('w2',5,0),remote=enemy('w3',15,0),boss=enemy('boss',1,1,{boss:true});
 EmberEnemyAI.notifyHit(wolf,[wolf,ally,remote,boss],0,20);
 assert.equal(wolf.alertTimer,10);
 assert.ok(ally.alertTimer>=5);
 assert.equal(remote.alertTimer,undefined);
 assert.equal(boss.alertTimer,undefined);
 EmberEnemyAI.ensure(wolf);EmberEnemyAI.ensure(ally);
 assert.notEqual(wolf.flankSide,ally.flankSide);
 const flank=EmberEnemyAI.movement(wolf,0,5,[wolf,ally]);
 assert.equal(flank.coordinated,true);
 assert.ok(Math.abs(flank.x)>.1);
});
test('guardians can evade alerted arrows once and respect cooldown',()=>{
 const e=enemy('g1',0,0,{shield:true});
 const arrow={x:0,z:5,vx:0,vz:-26};
 assert.equal(EmberEnemyAI.dodgeArrow(e,[arrow]),null,'idle enemy must not dodge a surprise shot');
 EmberEnemyAI.notifyHit(e,[e],0,5);
 const dodge=EmberEnemyAI.dodgeArrow(e,[arrow]);
 assert.ok(dodge&&Math.abs(dodge.x)>0);
 assert.equal(EmberEnemyAI.dodgeArrow(e,[arrow]),null,'no repeated dodge while cooling down');
 EmberEnemyAI.tick(e,.3);
 assert.equal(e.dodgeTime,0);
 assert.ok(e.dodgeCooldown>0);
 assert.equal(EmberEnemyAI.dodgeArrow(e,[arrow]),null);
 EmberEnemyAI.tick(e,3);
 assert.ok(EmberEnemyAI.dodgeArrow(e,[arrow]));
});
test('enemy telegraphs count down and spirit retreats if the player closes in',()=>{
 const wolf=enemy('w1');
 EmberEnemyAI.startWarning(wolf,.45);
 EmberEnemyAI.tick(wolf,.2);assert.ok(wolf.telegraph>.2);
 EmberEnemyAI.tick(wolf,.3);assert.equal(wolf.telegraph,0);
 const spirit=enemy('s1',0,0,{spirit:true});
 const far=EmberEnemyAI.movement(spirit,0,12);assert.ok(far.z>0);
 const close=EmberEnemyAI.movement(spirit,0,3);assert.ok(close.z<0);
});
