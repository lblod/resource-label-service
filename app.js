import { app, errorHandler, sparqlEscapeUri, sparqlEscapeString, query } from 'mu';

app.get('/info', async (req, res) => {
  const {term, language = 'nl'} = req.query;
  if(!term) {
    const jsonApiError = generateJsonApiError({
      id: 'no-term-specified',
      title: 'No term specified',
      detail: 'The service cannot find the term in the url, you should check the syntax of your request',
      status: '400'
    });
    res.status(400);
    return res.json(jsonApiError);
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
    const jsonApiError = generateJsonApiError({
      id: 'no-info',
      title: 'No info found in the db',
      detail: 'The service cannot find information about the term in the triplestore. Double check that the information is present in the queried language',
      status: '404'
    });
    res.status(404);
    return res.json(jsonApiError);
  }
  const label = info.label ? info.label.value : '';
  const comment = info.comment ? info.comment.value : '';
  const jsonApiResponse = generateJsonApiResponse(term, label, comment)
  res.setHeader('MU_AUTH_CACHE_KEYS', JSON.stringify([{"name": "getInfo", parameters:[]}]));
  res.json(jsonApiResponse);
});

function generateJsonApiResponse(term, label, comment) {
  return {
    type: "uri",
    id: term,
    attributes: {
      label,
      comment,
    }
  };
}

function generateJsonApiError({id, status, title, detail}) {
  return {
    errors: [
      {
        id,
        status,
        title,
        detail
      }
    ] 
  }
}



app.use(errorHandler);
