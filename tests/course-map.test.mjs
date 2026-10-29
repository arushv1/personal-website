import test from 'node:test';
import assert from 'node:assert/strict';
import {sectionById} from '../src/content/portfolio.mjs';
import {courseBranches,workNodes,connections,courseSkills,courseMapNote} from '../src/content/course-map.mjs';

test('the three course branches include all 13 source courses exactly once',()=>{
 const courses=sectionById.courses.items,ids=courses.map(course=>course.id),mapped=courseBranches.flatMap(branch=>branch.courseIds);
 assert.equal(courses.length,13);assert.equal(new Set(ids).size,13);
 assert.deepEqual(courseBranches.map(branch=>branch.id),['computation','biomedical','design']);
 assert.deepEqual(courseBranches.map(branch=>branch.courseIds.length),[6,5,2]);
 assert.equal(new Set(mapped).size,13);assert.deepEqual([...mapped].sort(),[...ids].sort());
 for(const branch of courseBranches)assert(branch.title&&branch.description&&branch.icon);
 for(const course of courses)assert(course.title&&course.subtitle&&course.summary);
 assert.deepEqual(Object.keys(courseSkills).sort(),[...ids].sort());
});

test('supplied course codes and affiliations retain their established entries',()=>{
 const courses=sectionById.courses.items,byId=Object.fromEntries(courses.map(course=>[course.id,course]));
 assert.equal(byId['research-programming-life-sciences'].subtitle,'BME160');
 assert.match(byId['research-programming-life-sciences'].summary,/University of California, Santa Cruz/);
 assert.equal(byId['engineering-design-refugee-health'].subtitle.replaceAll(' ',''),'ENGBE478');
 assert.equal(byId['introduction-engineering-hands-on'].subtitle.replaceAll(' ',''),'ENGEK131');
 assert.equal(courses.filter(course=>course.subtitle.replaceAll(' ','')==='ENGBE209').length,1);
});

test('every proposed map connection resolves to a real course and project or publication',()=>{
 const courses=new Set(sectionById.courses.items.map(course=>course.id)),works=new Map(workNodes.map(work=>[work.id,work]));
 assert.equal(works.size,4);assert.equal(new Set(connections.map(link=>link.courseId+'|'+link.workId)).size,connections.length);
 assert.deepEqual([...works.keys()].sort(),['bci-motor-rehabilitation','symptomai','threshold','vascupath']);
 for(const work of workNodes){
  assert(['projects','publications'].includes(work.sectionId));
  assert(sectionById[work.sectionId].items.some(item=>item.id===work.itemId),`Broken destination for ${work.id}`);
  assert(connections.some(link=>link.workId===work.id),`${work.id} needs a discoverable course connection`);
 }
 for(const link of connections){assert(courses.has(link.courseId));assert(works.has(link.workId));assert(link.summary);}
 assert.match(courseMapNote,/proposed/i);
 // An unconnected course must remain in the catalogue rather than gain a fabricated link.
 assert(!connections.some(link=>link.courseId==='thermodynamics-statistical-mechanics'));
});
