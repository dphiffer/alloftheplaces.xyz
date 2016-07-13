# alloftheplaces.xyz

Here's how to set this up:

* Copy `config-exaple.php` to `config.php` and edit it with [API keys](https://mapzen.com/developers/)
* Run `make setup` to download and setup libraries
* Make the `cache` folder writable by the web server user

It assumes you're running the site from the root of your web server. For testing/development purposes you could do this:

```
php -S localhost:8000
```

... and then load up http://localhost:8000/
