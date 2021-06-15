'use strict';

const fs = require('fs');

var args = process.argv.slice(2);

var config;
try {
  config = JSON.parse(fs.readFileSync(args[0]));
} catch (err) { // Most likely, arguments are numPatients and numInstances
  config = JSON.parse(fs.readFileSync('saidman-config.json'));
  config.patientsPerInstance = +args[0];
  config.numberOfInstances = +args[1];
  config.testing = true;
}

config.patientBtDistribution = new BloodTypeDistribution(
    config.patientBtDistribution.probO,
    config.patientBtDistribution.probA,
    config.patientBtDistribution.probB,
    config.patientBtDistribution.probAB);

if (config.donorBtDistributionByPatientO) {
  config.donorBtDistributionByPatientO = new BloodTypeDistribution(
    config.donorBtDistributionByPatientO.probO,
    config.donorBtDistributionByPatientO.probA,
    config.donorBtDistributionByPatientO.probB,
    config.donorBtDistributionByPatientO.probAB)
  config.donorBtDistributionByPatientA = new BloodTypeDistribution(
    config.donorBtDistributionByPatientA.probO,
    config.donorBtDistributionByPatientA.probA,
    config.donorBtDistributionByPatientA.probB,
    config.donorBtDistributionByPatientA.probAB)
  config.donorBtDistributionByPatientB = new BloodTypeDistribution(
    config.donorBtDistributionByPatientB.probO,
    config.donorBtDistributionByPatientB.probA,
    config.donorBtDistributionByPatientB.probB,
    config.donorBtDistributionByPatientB.probAB)
  config.donorBtDistributionByPatientAB = new BloodTypeDistribution(
    config.donorBtDistributionByPatientAB.probO,
    config.donorBtDistributionByPatientAB.probA,
    config.donorBtDistributionByPatientAB.probB,
    config.donorBtDistributionByPatientAB.probAB)
  config.donorBtDistributionByPatientNDD = new BloodTypeDistribution(
    config.donorBtDistributionByPatientNDD.probO,
    config.donorBtDistributionByPatientNDD.probA,
    config.donorBtDistributionByPatientNDD.probB,
    config.donorBtDistributionByPatientNDD.probAB)
} else {
  config.donorBtDistribution = new BloodTypeDistribution(
    config.donorBtDistribution.probO,
    config.donorBtDistribution.probA,
    config.donorBtDistribution.probB,
    config.donorBtDistribution.probAB);
}

if (config.tune) {
  var tuneIter = config.tune.iters || 50;
  var tuneError = config.tune.error || 0.005;
  var tuneSize = config.tune.size || config.patientsPerInstance;
  config = TuneConfig(config, tuneIter, tuneError, tuneSize,
    true /* tuneBloodTypes */,
    config.donorCountProbabilities[0] != 1 /* tuneDonors */);
}

var gen = new KidneyGenerator(config);

for (var i=0; i < config.numberOfInstances; i++) {
  var generatedDataset = gen.generateDataset(config.patientsPerInstance, config.proportionAltruistic);
  if (config.testing) {
    var d = generatedDataset.data;
    for (var j=0; j<d.length; j++) {
      var val = d[j];
      if ("matches" in val) {
        console.log(val.matches.length);
      } else {
        console.log(0);
      }
    }
  }
  if (! config.testing) {
    var filename = config.outputName || "Generated";
    filename += "_" + config.patientsPerInstance;
    var format = config.outputFormat || "json";
    filename += "_" + i + "." + format;
    var nullfn = function() {};
    var fullDetails = config.fullDetails == "true";
    if (format == "json") {
      fs.writeFile(filename, generatedDataset.toJsonString(fullDetails), nullfn);
    } else {
      fs.writeFile(filename, generatedDataset.toXmlString(fullDetails), nullfn);
    }
  }
}
