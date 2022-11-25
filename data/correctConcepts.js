const fs = require('fs');
const standard = require('./_design-everything-_view-byDocId.json');

function correctConcepts() {
  const outlinesliveNewDocs = [];
  // const standard = fs.readFileSync('../data/_design-everything-_view-byDocId.json');
  const outlineslive = JSON.parse(fs.readFileSync('./outlineslive.json'));
  // console.log(standard);
  console.log(`Standard rows: ${standard.rows.length}`);
  console.log(`Outlineslive records: ${outlineslive.docs.length}`);
  const indexedStandard = standard.rows.reduce((acc, currentValue) => {
    return {...acc, [currentValue.id]: currentValue };
  }, {});
  // kyk:2011-06-06T19:00:00.001Z:ol
  outlineslive.docs.forEach(record => {
    const newDoc = {...record};
    if (!record._id.endsWith(':ol')) {
      outlinesliveNewDocs.push(newDoc);
      return;
    }
    const outlinesliveConcepts = record.body.concepts;
    if (!indexedStandard[record._id]) {
      console.log(`Not found in standard: ${record._id}`);
      outlinesliveNewDocs.push(newDoc);
      return;
    }
    const standardConcepts = indexedStandard[record._id].value.body.concepts;
    if (JSON.stringify(outlinesliveConcepts) !== JSON.stringify(standardConcepts)) {
      console.log(`Fixed ${record._id}`);
      newDoc.body.concepts = [...standardConcepts];
      outlinesliveNewDocs.push(newDoc);
    } else {
      outlinesliveNewDocs.push(newDoc);
    }
  });
  fs.writeFileSync('./outlineslive.json', JSON.stringify({docs: outlinesliveNewDocs}));
}

correctConcepts();

/* 
Standard rows: 398
Outlineslive records: 404
Fixed kyk:2012-05-28T19:13:55.739Z:ol
Fixed kyk:2013-11-05T12:14:21.802Z:ol
Fixed kyk:2013-11-06T06:58:49.158Z:ol
Fixed kyk:2013-11-06T12:22:44.461Z:ol
Fixed kyk:2013-11-06T12:38:17.608Z:ol
Fixed kyk:2013-11-06T13:13:48.092Z:ol
Fixed kyk:2013-12-30T09:12:34.408Z:ol
Fixed kyk:2013-12-31T02:34:07.424Z:ol
Fixed kyk:2014-01-02T13:48:50.475Z:ol
Fixed kyk:2014-11-01T19:42:14.764Z:ol
Not found in standard: kyk:2022-11-15T01:47:26.187Z:ol
Not found in standard: kyk:2022-11-15T01:48:53.648Z:ol
Not found in standard: kyk:2022-11-15T01:58:40.225Z:ol
*/