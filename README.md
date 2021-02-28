# resource labels service
This image provides an endpoint for retrieving information about a specific URI.
It exposes the GET endpoint `/info` that accepts a `term` and a `language` parameters, this endpoint returns a json:api compliant object with the `label` and the `comment` associated with the specified term in the language selected.

Response example:
```
{
    "type": "uri",
    "id": "http://data.vlaanderen.be/ns/besluit#Zitting",
    "attributes": {
        "label": "Zitting",
        "comment": "Een geformaliseerde samenkomst van de leden van een bestuursorgaan met het doel om de aangelegenheden te regelen waarvoor het bevoegd is."
    }
}
```

## Getting started
_Getting started with resource labels service_

### Embedded in your project

The service needs to be embedded in your docker-compose.yml file like this

```
resource-labels:
  image: lblod/resource-label-service:0.3.0
  restart: always
  logging: *default-logging
  labels:
    - "logging=true"
```

Keep in mind that this README file can be outdated and the last version of the microservice can be different.

### Dispatcher

For the service to work you need to expose the GET endpoint, for this we will need to add the following snippet to our dispatcher file

```
get "/resource-labels/*path" do
  Proxy.forward conn, path, "http://resource-labels/"
end
```

With this configuration we will be able to send a GET request to `/resource-labels/info` with our term as an URL parameter and we will get the information wanted.

### DB information

For this service to work we need to have the data we want about the uris in our triplestore, this microservice reads the properties `rdfs:label` and `rdfs:comment` of the uris specified, `rdfs` being `<http://www.w3.org/2000/01/rdf-schema#>`.
The information must also be on the language the user queries, by default the language queried is `nl`.
An example of a term in the triplestore is

```
<http://data.vlaanderen.be/ns/mandaat#Fractie> a owl:Class ;
  rdfs:label "Parliamentary Group"@en,
      "Fractie"@nl ;
  rdfs:comment "A parliamentary group is a part of a directly elected representative body whose members wish to work together on a substantive and logistical level. The formal framework defines who can form a parliamentary group, usually it consists of representatives representing the same political party or flow."@en,
      "Een fractie is een deel van een rechtstreeks verkozen volksvertegenwoordigend orgaan waarvan de leden op inhoudelijk en logistiek vlak willen samenwerken. Het formeel kader bepaalt wie samen een fractie kan vormen, doorgaans bestaat ze uit volksvertegenwoordigers die tot dezelfde politieke partij of stroming behoren."@nl ;
  rdfs:isDefinedBy <http://data.vlaanderen.be/ns/mandaat> ;
  rdfs:subClassOf org:Organization .
```

## How-to guides

_Specific guides how to apply this container_

### Adding mu-cache
This service supports mu-cache for the retrieval of labels. You just need to add the cache container to your docker-compose file and link this service as `backend`:

```
label-cache:
  image: semtech/mu-cache:2.0.1
  links:
    - resource-labels:backend
  restart: always
  logging: *default-logging
  labels:
    - "logging=true"
```

Update the dispatcher config to redirect to the cache instead of this service directly:

```
get "/resource-labels/*path" do
  Proxy.forward conn, path, "http://label-cache/"
end
```

Cache updating is not (yet) implemented. Hence, if labels change in the database, the `label-cache`  service must be restarted manually.

## API

_Provided application interface_

### Endpoints

#### `/info`

- method: `GET`
- parameters:
  - term: The uri you want to obtain the info from.
  - language: The language you want to get the information in. The default language is `nl`. If you specify ``nil` information won't be filtered on language, if not provided in the query.
- response: The response is json:api compliant and will have 2 main attributes:
  - label: The label correspondent to the uri sent in the url. Is the property `rdfs:label` in the triplestore
  - comment: The comment explaining the uri sent in the url. Correspond to the property `rdfs:comment` in the triplestore.
- Examples:
  - Example of request: `http://localhost:4200/resource-labels/info?term=http%3A%2F%2Fdata.vlaanderen.be%2Fns%2Fbesluit%23Zitting&language=en`
  - Example of response: `{
    "type": "uri",
    "id": "http://data.vlaanderen.be/ns/besluit#Zitting",
    "attributes": {
        "label": "Zitting",
        "comment": "Een geformaliseerde samenkomst van de leden van een bestuursorgaan met het doel om de aangelegenheden te regelen waarvoor het bevoegd is."
    }
}`
- Errors: The service can return the following error codes:
  - `no-term`: This means the service cannot find the term in the url, you should check the syntax of your request
  - `no-info`: This means that the service cannot find information about the term in the triplestore. Double check that the information is present in the queried language.
