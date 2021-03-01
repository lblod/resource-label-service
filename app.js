import { app, errorHandler, sparqlEscapeUri, sparqlEscapeString, query, uuid } from 'mu';


let DEFAULT_LANGUAGE;

// If no default language is provided, nl will be used as default if not specified in query.
if(!process.env.DEFAULT_LANGUAGE){
  DEFAULT_LANGUAGE = 'nl';
}
// The language is specicified, we will use the latter as default if not specified in query.
else if(!process.env.DEFAULT_LANGUGAGE == 'nil'){
  DEFAULT_LANGUAGE = DEFAULT_LANGUAGE;
}
//else The language is nil, we don't filter on language.

console.log(`The default language will be ${DEFAULT_LANGUAGE}`);

app.get('/info', async (req, res) => {
  const {term, language = DEFAULT_LANGUAGE } = req.query;

  if(!term) {
    const jsonApiError = generateJsonApiError({
      code: 'no-term-specified',
      title: 'No term specified',
      detail: 'The service cannot find the term in the url, you should check the syntax of your request.',
      status: '400'
    });
    return res.status(400).json(jsonApiError);
  }

  let languageFilterLabel = language ? `FILTER (lang(?label) = ${sparqlEscapeString(language)})` : '';
  let languageFilterComment = language ? `FILTER (lang(?comment) = ${sparqlEscapeString(language)})` : '';

  const queryResult = await query(`
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    SELECT ?label ?comment WHERE {
      ${sparqlEscapeUri(term)} (rdfs:label|skos:prefLabel) ?label.
      ${languageFilterLabel}
      OPTIONAL {
        ${sparqlEscapeUri(term)} (rdfs:comment|skos:definition) ?comment.
        ${languageFilterComment}
      }
    }
  `);

  const info = queryResult.results.bindings[0];

  res.set('cache-keys', JSON.stringify([{"name": "resource-labels", parameters:[]}]));
  if (!info) {
    return res.status(200).json({ data: null });
  } else {
    const label = info.label ? info.label.value : '';
    const comment = info.comment ? info.comment.value : '';
    const jsonApiResponse = generateJsonApiResponse(term, label, comment);
    return res.status(200).json(jsonApiResponse);
  }

});

function generateJsonApiResponse(term, label, comment) {
  return {
    data: {
      type: "uri",
      id: term,
      attributes: {
        label,
        comment
      }
    }
  };
}

function generateJsonApiError({code, status, title, detail}) {
  const id = uuid();
  return {
    errors: [
      {
        id,
        code,
        status,
        title,
        detail
      }
    ]
  };
}

app.use(errorHandler);
