import { app, errorHandler, sparqlEscapeUri, sparqlEscapeString, query } from 'mu';

app.get('/getInfo', async (req, res) => {
  const {term, language = 'nl'} = req.query;
  if(!term) {
    return res.json({error: 'No term specified'});
  }
  console.log(term)
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
    return res.json({error: 'No info in the db'});
  }
  const infoFormatted = {
    label: info.label ? info.label.value : '',
    comment: info.comment ? info.comment.value : '',
  };
  res.setHeader('MU_AUTH_CACHE_KEYS', JSON.stringify([{"name": "getInfo", parameters:[]}]));
  res.json(infoFormatted);
});



app.use(errorHandler);
