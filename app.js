import { app, errorHandler, sparqlEscapeUri, sparqlEscapeString } from 'mu';
import { querySudo as query } from '@lblod/mu-auth-sudo';

import bodyParser from 'body-parser';

const cache = {

};

// parse application/json
app.use(bodyParser.json());

app.post('/getInfo', async (req, res) => {
  const {term, language = 'nl'} = req.body;
  if(cache[term] && cache[term][language]) {
    return res.json(cache[term][language]);
  }
  const queryResult = await query(`
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT ?label ?comment WHERE {

      ${sparqlEscapeUri(term)} rdfs:label ?label.
      FILTER (lang(?label) = ${sparqlEscapeString(language)})

      OPTIONAL {
        ${sparqlEscapeUri(term)} rdfs:comment ?comment.
        FILTER (lang(?comment) = ${sparqlEscapeString(language)})
      }
    }
  `);
  const info = queryResult.results.bindings[0];
  if(!info) {
    return res.json({error: 'No info in the db'})
  }
  const infoFormatted = {
    label: info.label ? info.label.value : '',
    comment: info.comment ? info.comment.value : '',
  }
  if(!cache[term]) {
    cache[term] = {}
    cache[term][language] = infoFormatted;
  } else {
    cache[term][language] = infoFormatted;
  }
  res.json(infoFormatted);
});

app.get('/test', async (req, res) => {
  res.send('Hello World');
});

app.use(errorHandler);
