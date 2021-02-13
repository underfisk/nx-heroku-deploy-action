# NX Heroku Deploy

An action that allows you to deploy to Heroku via docker container and support Nx tool
Nx will build your app dynamically according to the given appName (this is used in some of my projects) where
i do have a lot of projects under a mono-repo and i want to push via Github and build accordingly

## CI Config file 
This file states the metadata that this action needs in order to provide also ARGs to the docker image 
An example of a config file

```json 
{
    "apps": {
        "backend": {
            "formation": "web", //This is optional and we support web/worker, heroku formation
            "branches": ["staging-backend", "production-backend", "quality-backend"], //Here you defined the list of supported branches 
            "herokuAppName": "backend", //Specify the app name on backend
        }
    }
}
```

## How to use it

```yml
name: '' #set your github job
on: {} # set the events you would like to trigger this job
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Build, Push and Deploy to Heroku #set the whatever name you want to this step
        id: heroku
        uses: underfisk/nx-heroku-deploy-action@latest  # use the latest version of the action
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }} # your  heroku api key
          ci_config_path: 'my-custom-ci.json' #its optional by default we search for github-ci.json
```
