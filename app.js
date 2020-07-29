import { app, errorHandler, sparqlEscapeUri, sparqlEscapeString } from 'mu';
import { querySudo as query } from '@lblod/mu-auth-sudo';

import bodyParser from 'body-parser';

// parse application/json
app.use(bodyParser.json());

app.post('/getInfo', async (req, res) => {
  const {term, language = 'nl'} = req.body;
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
  res.json({
    label: info.label ? info.label.value : '',
    comment: info.comment ? info.comment.value : '',
  });
});

app.get('/test', async (req, res) => {
  res.send('Hello World');
});

app.use(errorHandler);
