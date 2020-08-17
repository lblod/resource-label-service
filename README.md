# resource labels service
This image provides an endpoint for retrieving information about a specific uri.
It exposes the GET endpoint `/info` that accepts a `term` and a `language` parameters, this endpoint returns a json object with the `label` and the `comment` associated with the specified term in the language selected.

## Getting started 
_Getting started with resource labels service_

### Embedded in your project

The service needs to be embedded in your docker-compose.yml file like this

```
resource-labels:
  image: lblod/resource-label-service:0.0.2
  restart: always
  logging: *default-logging
  labels:
    - "logging=true"
```

Keep in mind that this README file can be outdated and the last version of the microservice can be different.

### Dispatcher

For the service to work you need to expose the GET endpoint, for this we will need to add the following snippet to our dispatcher file

```
match "/resource-labels/*path" do
  Proxy.forward conn, path, "http://resource-labels/"
end
```

With this configuration we will be able to send a GET request to `/resource-labels/info` with our term as an URL parameter and we will get the information wanted.

### DB information

For this service to work we need to have the data we want about the uris in our database, this microservice reads the properties `rdfs:label` and `rdfs:comment` of the uris specified, `rdfs` being `<http://www.w3.org/2000/01/rdf-schema#>`.
The information must also be on the language the user queries, by default the language queried is `nl`.
An example of a term in the database is
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
This service fully supports mu-cache out of the box, you just need to add the cache container to your docker-compose file and link it to this service:

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

Then redirect the dispatcher route to the cache instead of the service:

```
match "/resource-labels/*path" do
  Proxy.forward conn, path, "http://label-cache/"
end
```

