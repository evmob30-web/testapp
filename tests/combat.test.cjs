const {test}=require('node:test'),assert=require('node:assert/strict');require('../js/combat.js');
test('roll direction normalizes diagonal movement and cooldown blocks repeat rolls',()=>{const c=EmberCombat.create();assert.ok(EmberCombat.dodge(c,1,1));assert.ok(Math.abs(Math.hypot(c.x,c.z)-1)<1e-10);assert.equal(c.remaining,.38);assert.equal(EmberCombat.dodge(c,0,-1),false);EmberCombat.tick(c,.4);assert.equal(c.remaining,0);assert.equal(EmberCombat.dodge(c,0,-1),false);EmberCombat.tick(c,1);assert.ok(EmberCombat.dodge(c,0,-1));assert.equal(c.z,-1);});
test('zero direction cannot spend a roll and timers never become negative',()=>{const c=EmberCombat.create();assert.equal(EmberCombat.dodge(c,0,0),false);assert.equal(c.cooldown,0);EmberCombat.tick(c,10);assert.equal(c.cooldown,0);assert.equal(c.remaining,0);});
test('projectile collision is swept, including large steps and stationary segments',()=>{assert.ok(EmberCombat.segmentHit(-10,0,10,0,0,0,.85));assert.ok(!EmberCombat.segmentHit(-10,0,10,0,0,2,.85));assert.ok(EmberCombat.segmentHit(0,0,0,0,.5,0,.85));assert.ok(!EmberCombat.segmentHit(0,0,1,0,2,0,.5));});

test('three-hit sword chain progresses, finishes, then restarts',()=>{
 const combo=EmberCombat.createCombo();
 const first=EmberCombat.nextCombo(combo);
 assert.equal(first.step,1);assert.equal(first.multiplier,1);
 EmberCombat.tickCombo(combo,.36);
 const second=EmberCombat.nextCombo(combo);
 assert.equal(second.step,2);assert.ok(second.multiplier>first.multiplier);
 EmberCombat.tickCombo(combo,.34);
 const third=EmberCombat.nextCombo(combo);
 assert.equal(third.step,3);assert.ok(third.multiplier>second.multiplier);
 assert.ok(third.cooldown>second.cooldown);
 assert.equal(EmberCombat.nextCombo(combo).step,1);
});
test('combo expires after inactivity and resets after interruptions',()=>{
 const combo=EmberCombat.createCombo();
 EmberCombat.nextCombo(combo);EmberCombat.tickCombo(combo,.95);
 assert.equal(combo.step,0);assert.equal(combo.window,0);
 assert.equal(EmberCombat.nextCombo(combo).step,1);
 EmberCombat.nextCombo(combo);
 EmberCombat.resetCombo(combo);
 assert.equal(EmberCombat.nextCombo(combo).step,1);
 EmberCombat.tickCombo(combo,Infinity);
 assert.equal(combo.step,0);
});
