import { app, errorHandler, sparqlEscapeUri, sparqlEscapeString, query, uuid } from 'mu';

let DEFAULT_LANGUAGE;

if (!process.env.DEFAULT_LANGUAGE){
  // Fallback to nl as default language if language is not specified in query.
  DEFAULT_LANGUAGE = 'nl';
} else if (process.env.DEFAULT_LANGUAGE != 'nil'){
  // Set configured language as default if language is not specified in query.
  DEFAULT_LANGUAGE = process.env.DEFAULT_LANGUAGE;
} else { // language == 'nil'
  // Disable filter on language
  DEFAULT_LANGUAGE = null;
}

if (DEFAULT_LANGUAGE)
  console.log(`The default language will be ${DEFAULT_LANGUAGE}`);
else
  console.log('Filter on language is disabled');

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

  const languageFilterLabel = language ? `FILTER (lang(?label) = ${sparqlEscapeString(language)})` : '';
  const languageFilterComment = language ? `FILTER (lang(?comment) = ${sparqlEscapeString(language)})` : '';

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

  res.set('cache-keys', JSON.stringify([{ name: 'resource-labels', parameters: [] }]));
  if (info) {
    const jsonApiResponse = generateJsonApiResponse(term, info.label?.value, info.comment?.value);
    return res.status(200).json(jsonApiResponse);
  } else {
    return res.status(200).json({ data: null });
  }

});

function generateJsonApiResponse(term, label, comment) {
  return {
    data: {
      type: 'uri',
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
