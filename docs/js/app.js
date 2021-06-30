'use strict';

var kidneyApp = angular.module("kidneyApp", [
  "ngRoute",
  "kidneyControllers"
]);

kidneyApp.config(["$routeProvider",
  function($routeProvider) {
    $routeProvider
      .when("/", {
        templateUrl: "partials/home.html",
        controller: "HomeCtrl"
      })
      .when("/generator", {
        templateUrl: "partials/generator.html",
        controller: "GeneratorCtrl"
      })
      .when("/converter", {
        templateUrl: "partials/converter.html",
        controller: "ConverterCtrl"
      })
      .when("/about", {
        templateUrl: "partials/about.html",
        controller: "AboutCtrl"
      })
      .otherwise({redirectTo: ""})
}]);
