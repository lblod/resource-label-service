# resource-label-service
This image provides an endpoint for retrieving information about a specific URI.

## Getting started
### Add the resource-label service to your project

Add the following snippet to your `docker-compose.yml`:

```yaml
resource-labels:
  image: lblod/resource-label-service:0.3.1
```

For the service to work you need to expose the GET endpoint in the dispatcher service. Add the following snippet to the dispatcher rules in `./config/dispatcher/dispatcher.ex`:

```elixir
get "/resource-labels/*path" do
  Proxy.forward conn, path, "http://resource-labels/"
end
```

Restart dispatcher and start the resource-labels service by executing

```bash
docker-compose restart dispatcher
docker-compose up -d resource-labels
```

By sending a GET request to `/resource-labels/info?term=<uri>` you will get human-readable information about the provided URI.

## How-to guides
### How to add caching using mu-cache?
This service supports mu-cache for the retrieval of labels. You just need to add the cache container to your docker-compose file and link this service as `backend`:

```
resource-labels-cache:
  image: semtech/mu-cache:2.0.2
  links:
    - resource-labels:backend
```

Update the dispatcher config to redirect to the cache instead of this service directly:

```
get "/resource-labels/*path" do
  Proxy.forward conn, path, "http://resource-labels-cache/"
end
```

Cache updating is not (yet) implemented. Hence, if labels change in the database, the `resource-labels-cache` service must be restarted manually.

### How to add information about URIs in the triplestore?
An example TTL to add information about URI `http://data.vlaanderen.be/ns/mandaat#Fractie` to the triplestore:

```ttl
<http://data.vlaanderen.be/ns/mandaat#Fractie> a owl:Class ;
  rdfs:label "Parliamentary Group"@en, "Fractie"@nl ;
  rdfs:comment "A parliamentary group is a part of a directly elected representative body whose members wish to work together on a substantive and logistical level. The formal framework defines who can form a parliamentary group, usually it consists of representatives representing the same political party or flow."@en,
      "Een fractie is een deel van een rechtstreeks verkozen volksvertegenwoordigend orgaan waarvan de leden op inhoudelijk en logistiek vlak willen samenwerken. Het formeel kader bepaalt wie samen een fractie kan vormen, doorgaans bestaat ze uit volksvertegenwoordigers die tot dezelfde politieke partij of stroming behoren."@nl .
```

## Reference
### API
#### GET `/info`
Returns a label and comment for the given URI in a JSON:API compliant response.

**Query parameters**
- **term**: URI to obtain data from (required)
- **language**: language of the information. Defaults to `nl`. Specify `nil` to not filter on language.

**Example response**
```json
{
  "data": {
    "type": "uri",
    "id": "http://data.vlaanderen.be/ns/besluit#Zitting",
    "attributes": {
      "label": "Zitting",
      "comment": "Een geformaliseerde samenkomst van de leden van een bestuursorgaan met het doel om de aangelegenheden te regelen waarvoor het bevoegd is."
    }
  }
}
```

### Data model
For this service to return data, information about the URIs need to be added to the triplestore.

The service currently reads the following properties:
* for the `label` field:
  * `rdfs:label`
  * `skos:prefLabel`
* for the `comment` field:
  * `rdfs:comment`
  * `skos:definition`

A language tag may be added to the values. By default, the information is queried with language `nl`.

### Configuration
The following environment variables can be set to configure the service:
- **DEFAULT_LANGUAGE**: default language to use to query information. Defaults to `nl`. Set to `nil` to disable filtering on language.
