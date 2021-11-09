'use strict';

/* Controllers */

var kidneyControllers = angular.module('kidneyControllers' , []);

/*
kidneyControllers.controller('AnalyserCtrl', function($scope, $http) {
  $scope.results = [];
  $scope.onSubmitted = function() {
    var files = $("#analyser-file").get(0).files;
    $scope.uploadFile(files, 0);
    $scope.results = [];
  };
  $scope.uploadFile = function(files, index) {
    if (index >= files.length) return;
    var file = files[index];
    var fileName = file.name;
    var reader = new FileReader();
    if (/\.json$/.test(fileName)) {
      reader.onload = function(e) {
        var iDataset = new GeneratedDataset();
        iDataset.readJsonString(e.target.result);
        var compactData = iDataset.toCompactString();
        analyse(compactData, fileName, files, index);
      };
    } else if (/\.input$/.test(fileName)) {
      console.log("input");
      reader.onload = function(e) {
        var iDataset = new GeneratedDataset();
        iDataset.readInputString(e.target.result);
        var compactData = iDataset.toCompactString();
        analyse(compactData, fileName, files, index);
      };
    } else if (/\.xml$/.test(fileName)) {
      console.log("xml");
      reader.onload = function(e) {
        var iDataset = new GeneratedDataset();
        iDataset.readXmlString(e.target.result);
        var compactData = iDataset.toCompactString();
        analyse(compactData, fileName, files, index);
      };
    }
    reader.readAsText(file);
  };
  var analyse = function(compactData, fileName, files, index) {
    $http({
      method: "POST",
      url: 'http://guarded-chamber-5937.herokuapp.com/',
      //url: 'http://localhost:5000',
      data: $.param({data:compactData}),
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function(data) {
      data.fileName = fileName;
      $scope.results.push(data);
      $scope.uploadFile(files, index+1);
    });
  }
});
*/

kidneyControllers.controller('ConverterCtrl', function($scope) {
  $scope.fileFormat = "xml";
  $scope.onSubmitted = function() {
    var zip = new JSZip();
    var nConverted = 0;
    var files = $("#converter-file").get(0).files;
    for (var i=0; i<files.length; i++) {
      var selectedFile = files[i];
      console.log(selectedFile.name);
      var reader = new FileReader();
      (function() {
        var fileName = selectedFile.name;
        var baseName = fileName.replace(/\.[^.]*$/, "");
        reader.onload = function(e) {
          console.log(e.target.result);
          var iDataset = new GeneratedDataset();
          if (/\.json$/.test(fileName)) {
            iDataset.readJsonString(e.target.result);
          } else if (/\.xml$/.test(fileName)) {
            iDataset.readXmlString(e.target.result);
          } else {
            iDataset.readInputString(e.target.result);
          }
          nConverted++;
          if ($scope.fileFormat==="xml") {
            zip.file(baseName + ".xml", iDataset.toXmlString());
          } else {
            zip.file(baseName + ".json", iDataset.toJsonString());
          }
          if (nConverted===files.length) {
            var content = zip.generate({type:"blob"});
            saveAs(content, "converted.zip");
          }
        };
      })();

      reader.readAsText(selectedFile);
    }

    /*var formData = new FormData($('#converter-form')[0]);
    var beforeSendHandler = function() {};
    var completeHandler = function() {};
    var errorHandler = function() {};
    var progressHandlingFunction = function(d) {console.log(d)};
    $.ajax({
        url: '/to-json.json',  //Server script to process data
        type: 'POST',
        xhr: function() {  // Custom XMLHttpRequest
            var myXhr = $.ajaxSettings.xhr();
            if(myXhr.upload){ // Check if upload property exists
                myXhr.upload.addEventListener('progress',progressHandlingFunction, false); // For handling the progress of the upload
            }
            return myXhr;
        },
        //Ajax events
        beforeSend: beforeSendHandler,
        success: completeHandler,
        error: errorHandler,
        // Form data
        data: formData,
        //Options to tell jQuery not to process data or worry about content-type.
        cache: false,
        contentType: false,
        processData: false
    });*/
  };
});




kidneyControllers.controller('GeneratorCtrl', function($scope) {
  angular.element(document).ready(function() {
  $(".split-donors").hide();
  $("input[name=splitdonors]").on("change", function() {
    var val = $(this).val();
    if (val == "off") {
      $(".split-donors").hide();
      $(".nosplit-donors").show();
    } else {
      $(".nosplit-donors").hide();
      $(".split-donors").show();
    }
  });
  $(".splitpra").hide();
  $("input[name=splitcpra]").on("change", function() {
    var val = $(this).val();
    if (val == "off") {
      $(".splitpra").hide();
      $(".nosplitpra").show();
    } else {
      $(".nosplitpra").hide();
      $(".splitpra").show();
    }
  });
  $("input[name=enableTuning]").on("change", function() {
    if ($(this).is(":checked")) {
      $(".tuning").prop("disabled", false);
    } else {
      $(".tuning").prop("disabled", true);
    }
  });

  });
  $scope.donorTypeO = 0.4;
  $scope.donorTypeA = 0.4;
  $scope.donorTypeB = 0.1;
  $scope.donorTypeAB = function(x) {
      return +(1-$scope.donorTypeO-$scope.donorTypeA-$scope.donorTypeB).toFixed(4);
  };

  $scope.patientTypeO = 0.4;
  $scope.patientTypeA = 0.4;
  $scope.patientTypeB = 0.1;
  $scope.patientTypeAB = function(x) {
      return +(1-$scope.patientTypeO-$scope.patientTypeA-$scope.patientTypeB).toFixed(4);
  };

  $scope.donorTypeOByPatientO = 0.4;
  $scope.donorTypeAByPatientO = 0.4;
  $scope.donorTypeBByPatientO = 0.1;
  $scope.donorTypeABByPatientO = function(x) {
      return +(1-$scope.donorTypeOByPatientO-$scope.donorTypeAByPatientO-$scope.donorTypeBByPatientO).toFixed(4);
  };

  $scope.donorTypeOByPatientA = 0.4;
  $scope.donorTypeAByPatientA = 0.4;
  $scope.donorTypeBByPatientA = 0.1;
  $scope.donorTypeABByPatientA = function(x) {
      return +(1-$scope.donorTypeOByPatientA-$scope.donorTypeAByPatientA-$scope.donorTypeBByPatientA).toFixed(4);
  };

  $scope.donorTypeOByPatientB = 0.4;
  $scope.donorTypeAByPatientB = 0.4;
  $scope.donorTypeBByPatientB = 0.1;
  $scope.donorTypeABByPatientB = function(x) {
      return +(1-$scope.donorTypeOByPatientB-$scope.donorTypeAByPatientB-$scope.donorTypeBByPatientB).toFixed(4);
  };

  $scope.donorTypeOByPatientAB = 0.4;
  $scope.donorTypeAByPatientAB = 0.4;
  $scope.donorTypeBByPatientAB = 0.1;
  $scope.donorTypeABByPatientAB = function(x) {
      return +(1-$scope.donorTypeOByPatientAB-$scope.donorTypeAByPatientAB-$scope.donorTypeBByPatientAB).toFixed(4);
  };

  $scope.donorTypeOByPatientNDD = 0.4;
  $scope.donorTypeAByPatientNDD = 0.4;
  $scope.donorTypeBByPatientNDD = 0.1;
  $scope.donorTypeABByPatientNDD = function(x) {
      return +(1-$scope.donorTypeOByPatientNDD-$scope.donorTypeAByPatientNDD-$scope.donorTypeBByPatientNDD).toFixed(4);
  };

  $scope.donorsPerPatient1 = 1;
  $scope.donorsPerPatient2 = 0;
  $scope.donorsPerPatient3 = 0;
  $scope.donorsPerPatient4 = function(x) {
      return +(1-$scope.donorsPerPatient1-$scope.donorsPerPatient2-$scope.donorsPerPatient3).toFixed(4);
  };

  $scope.probSpousal = 0;
  $scope.probFemale = 0;
  $scope.probSpousalPraCompatibility = 0;

  $scope.crfDistribution = "0.2 0.11\n0.8 0.89";

  $scope.compatPraBands = "0.2 0.11\n0.8 0.89";
  $scope.incompatPraBands = "0.2 0.11\n0.8 0.89";

  $scope.compatBandsString = "0 101 0 1";

  $scope.fileFormat = "xml";
  $scope.patientsPerInstance = 50;
  $scope.numberOfInstances = 5;
  $scope.proportionAltruistic = 0;

  $scope.tuneIters = "100";
  $scope.tuneSize = "1000";
  $scope.tuneErrs = "0.05";

  $scope.onSubmitted = function() {
    var genConfig = {
      donorCountProbabilities: [
        $scope.donorsPerPatient1,
        $scope.donorsPerPatient2,
        $scope.donorsPerPatient3,
        $scope.donorsPerPatient4()
      ],
      patientBtDistribution: new BloodTypeDistribution(
        $scope.patientTypeO,
        $scope.patientTypeA,
        $scope.patientTypeB,
        $scope.patientTypeAB()
      ),
      probSpousal: $scope.probSpousal,
      probFemale: $scope.probFemale,
      probSpousalPraCompatibility: $scope.probSpousalPraCompatibility,
      numberOfInstances: $scope.numberOfInstances,
      patientsPerInstance: $scope.patientsPerInstance,
      proportionAltruistic: $scope.proportionAltruistic,
      fileFormat: $scope.fileFormat,
      compatBandsString: $scope.compatPraBandsString,
    }
    if ($("input[name=splitdonors]").val() == "off") {
      genConfig.donorBtDistribution = new BloodTypeDistribution(
        $scope.donorTypeO,
        $scope.donorTypeA,
        $scope.donorTypeB,
        $scope.donorTypeAB()
      );
    } else {
      genConfig.donorBtDistributionByPatientO = new BloodTypeDistribution(
        $scope.donorTypeOByPatientO,
        $scope.donorTypeAByPatientO,
        $scope.donorTypeBByPatientO,
        $scope.donorTypeABByPatientO()
      );
      genConfig.donorBtDistributionByPatientA = new BloodTypeDistribution(
        $scope.donorTypeOByPatientA,
        $scope.donorTypeAByPatientA,
        $scope.donorTypeBByPatientA,
        $scope.donorTypeABByPatientA()
      );
      genConfig.donorBtDistributionByPatientB = new BloodTypeDistribution(
        $scope.donorTypeOByPatientB,
        $scope.donorTypeAByPatientB,
        $scope.donorTypeBByPatientB,
        $scope.donorTypeABByPatientB()
      );
      genConfig.donorBtDistributionByPatientAB = new BloodTypeDistribution(
        $scope.donorTypeOByPatientAB,
        $scope.donorTypeAByPatientAB,
        $scope.donorTypeBByPatientAB,
        $scope.donorTypeABByPatientAB()
      );
      genConfig.donorBtDistributionByPatientNDD = new BloodTypeDistribution(
        $scope.donorTypeOByPatientNDD,
        $scope.donorTypeAByPatientNDD,
        $scope.donorTypeBByPatientNDD,
        $scope.donorTypeABByPatientNDD()
      );
    }
    if ($("input[name=splitcpra]").val() == "off") {
      genConfig.praBandsString = $scope.crfDistribution
    } else {
      genConfig.compatPraBandsString = $scope.compatPraBands
      genConfig.incompatPraBandsString = $scope.incompatPraBands
    }
    genConfig.fullDetails = false;
    if ($("input[name=extraDetails]").is(":checked")) {
      genConfig.fullDetails = true;
    }
    if ($("input[name=enableTuning]").is(":checked")) {
      var tuneIters = +$("input[name=tuneIters]").val();
      var tuneSize = +$("input[name=tuneSize]").val();
      var tuneError = +$("input[name=tuneErrs]").val();
      var tuneBloodGroups = $("input[name=tuneBloodGroups").is(":checked");
      var tuneDonors = $("input[name=tuneDonors").is(":checked");
      var tunePRA = $("input[name=tunePRA").is(":checked");
      genConfig = TuneConfig(genConfig, tuneIters, tuneError, tuneSize, tuneBloodGroups, tuneDonors, tunePRA);
    }
    var gen = new KidneyGenerator(genConfig);
    var zip = new JSZip();
    zip.file("config.json", JSON.stringify(genConfig, undefined, 2));
    $("#progress-message").text("Generating instance 0");
      setTimeout(function() {
        generateInstances(zip, gen, genConfig, 0);
      }, 1);
    }

  $scope.useSaidmanValues = function() {
    $scope.probFemale = 0.4090;
    $scope.probSpousal = 0.4897;
    $scope.probSpousalPraCompatibility = 0.75;
    $scope.crfDistribution = "0.7019 0.05\n0.2 0.1\n0.0981 0.9";

    $scope.donorTypeA = 0.3373;
    $scope.donorTypeB = 0.1428;
    $scope.donorTypeO = 0.4814;

    $scope.patientTypeA = 0.3373;
    $scope.patientTypeB = 0.1428;
    $scope.patientTypeO = 0.4814;

    $scope.donorsPerPatient1 = 1;
    $scope.donorsPerPatient2 = 0;
    $scope.donorsPerPatient3 = 0;

    $scope.proportionAltruistic = 0;
  };

  $scope.loadSplitPRA = function() {
    $scope.compatPraBands = "0.0434637245068539 0\n0.00635239050484788 0.01 0.1\n0.00267469073888332 0.1 0.2\n0.00601805416248746 0.2 0.3\n0.00835840855901037 0.3 0.4\n0.0106987629555333 0.4 0.5\n0.0217318622534269 0.5 0.6\n0.0290872617853561 0.6 0.7\n0.0391173520561685 0.7 0.8\n0.0257438983617519 0.8 0.85\n0.0307589434971581 0.85 0.9\n0.0113674356402541 0.9\n0.0106987629555333 0.91\n0.0157138080909395 0.92\n0.0317619525242394 0.93\n0.0190571715145436 0.94\n0.0197258441992645 0.95\n0.0240722166499498 0.96\n0.0534938147776663 0.97\n0.0929455031761953 0.98\n0.180207288532263 0.99\n0.316950852557673 1\n";
    $scope.incompatPraBands = "0.356760886172651 0\n0.038961038961039 0.01 0.1\n0.0133689839572193 0.1 0.2\n0.0106951871657754 0.2 0.3\n0.0210084033613445 0.3 0.4\n0.0244461420932009 0.4 0.5\n0.0336134453781513 0.5 0.6\n0.0305576776165011 0.6 0.7\n0.0427807486631016 0.7 0.8\n0.0355233002291826 0.8 0.85\n0.0458365164247517 0.85 0.9\n0.00649350649350649 0.9\n0.0126050420168067 0.91\n0.0286478227654698 0.92\n0.00649350649350649 0.93\n0.00763941940412529 0.94\n0.0156608097784568 0.95\n0.0236822001527884 0.96\n0.0152788388082506 0.97\n0.0252100840336134 0.98\n0.0966386554621849 0.99\n0.108097784568373 1\n";
    $("input[name=splitcpra][value=on]").prop("checked", true);
    $(".nosplitpra").hide();
    $(".splitpra").show();
  }

  $scope.loadBandedXMatch = function() {
    $scope.compatBandsString = "0.0 0.50 0.4349 0.33012\n0.50 0.95 0.342 0.64194\n0.95 0.96 0.942\n0.96 0.97 0.947\n0.97 0.98 0.975\n0.98 0.99 0.985\n0.99 1 0.985\n1 1.01 0.988";
  }

  $scope.loadBandedXMatchPRA0 = function() {
    $scope.compatBandsString = "0.0 0.01 SPLIT 0.259681093394077-0.75-1,0.14123006833713-0.5-0.75,0.0911161731207289-0.25-0.5,0.0592255125284738-0.1-0.25,0.0546697038724375-0.04-0.1,0.020501138952164-0.03-0.04,0.0387243735763098-0.02-0.03,0.0774487471526196-0.01-0.02,0.0683371298405467-0-0.01,0.18906605922551-0\n0.01 0.50 0.4349 0.33012\n0.50 0.95 0.342 0.64194\n0.95 0.96 0.942\n0.96 0.97 0.947\n0.97 0.98 0.975\n0.98 0.99 0.985\n0.99 1 0.985\n1 1.01 0.988";
  }

  $scope.loadCalcXMatch = function() {
    $scope.compatBandsString = "0 1 0.45 0.51";
  }

  $scope.loadTweakXMatch = function() {
    $scope.compatBandsString = "0 1 0.45 0.55";
  }
  $scope.loadTweakXMatchPRA0 = function() {
    $scope.compatBandsString = "0.0 0.01 SPLIT 0.259681093394077-0.75-1,0.14123006833713-0.5-0.75,0.0911161731207289-0.25-0.5,0.0592255125284738-0.1-0.25,0.0546697038724375-0.04-0.1,0.020501138952164-0.03-0.04,0.0387243735763098-0.02-0.03,0.0774487471526196-0.01-0.02,0.0683371298405467-0-0.01,0.18906605922551-0\n0.01 1.01 0.45 0.55";
  }

  $scope.loadRecipBlood = function() {
    $scope.patientTypeA = 0.2325;
    $scope.patientTypeB = 0.1119;
    $scope.patientTypeO = 0.6293;
  }

  $scope.loadSplitDonorBlood = function() {
    $scope.donorTypeAByPatientO = 0.4899;
    $scope.donorTypeBByPatientO = 0.1219;
    $scope.donorTypeOByPatientO = 0.3721;

    $scope.donorTypeAByPatientA = 0.6039;
    $scope.donorTypeBByPatientA = 0.0907;
    $scope.donorTypeOByPatientA = 0.2783;

    $scope.donorTypeAByPatientB = 0.2719;
    $scope.donorTypeBByPatientB = 0.3689;
    $scope.donorTypeOByPatientB = 0.2910;

    $scope.donorTypeAByPatientAB = 0.4271;
    $scope.donorTypeBByPatientAB = 0.1910;
    $scope.donorTypeOByPatientAB = 0.3166;

    $scope.donorTypeAByPatientNDD = 0.399;
    $scope.donorTypeBByPatientNDD = 0.0939;
    $scope.donorTypeOByPatientNDD = 0.493;
    $(".nosplit-donors").hide();
    $(".split-donors").show();
    $("input[name=splitdonors][value=on]").prop("checked", true);
  }

});

// TODO: put this somewhere other than global scope
var generateInstances = function(zip, gen, genConfig, i) {
  var generatedDataset =
      gen.generateDataset(genConfig.patientsPerInstance,
                          genConfig.proportionAltruistic);
  console.log(genConfig.fullDetails);
  if (genConfig.fileFormat==="xml") {
    zip.file("genxml-" + i + ".xml", generatedDataset.toXmlString(genConfig.fullDetails));
  } else if (genConfig.fileFormat==="json") {
    zip.file("genjson-" + i + ".json", generatedDataset.toJsonString(genConfig.fullDetails));
  }

  if (++i < genConfig.numberOfInstances) {
    $("#progress-message").text("Generating instance " + i);
    setTimeout(function() {generateInstances(zip, gen, genConfig, i)}, 1);
  } else {
    $("#progress-message").text("Creating zip file.");
    setTimeout(function() {
      var content = zip.generate({type:"blob"});
      saveAs(content, "generated.zip");
      $("#progress-message").text("Finished.");
    }, 1);
  }
};

/*$( "#generator-form" ).on( "submit", function( event ) {
  event.preventDefault();
  var genConfig = $( this ).serializeObject();
  ////console.log(genConfig);
  var gen = new KidneyGenerator(genConfig);
  var zip = new JSZip();

  $("#progress-message").text("Generating instance 0");
  setTimeout(function() {
    generateInstances(zip, gen, 0);
  }, 1);
});
*/

kidneyControllers.controller('HomeCtrl', function($scope) {});
kidneyControllers.controller('AboutCtrl', function($scope) {});

