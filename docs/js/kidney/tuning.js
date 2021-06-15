function calculateBloodDistributions(dataset) {
  var result = {};
  var donorCounts = {O: 0, A: 0, B: 0, AB: 0};
  var donorTotal = 0;
  var recipCounts = {O: 0, A: 0, B: 0, AB: 0};
  var recipTotal = 0;
  var recipsSeen = {};
  for (var i = 0; i < dataset.getDonorCount() ; ++i) {
    var donor = dataset.getDonorAt(i);
    donorCounts[donor.bt.type] += 1;
    donorTotal += 1;
    for (var p = 0; p < donor.sources.length; ++p) {
      var patient = donor.sources[p];
      // Inspect each patient once
      if (recipsSeen[patient.id]) {
        continue;
      }
      recipCounts[patient.bt.type] += 1;
      recipTotal += 1;
      recipsSeen[patient.id] = true;
    }
  }
  result.donor = {probO: donorCounts.O / donorTotal, probA: donorCounts.A / donorTotal, probB: donorCounts.B / donorTotal, probAB: donorCounts.AB / donorTotal};
  result.recip = {probO: recipCounts.O / recipTotal, probA: recipCounts.A / recipTotal, probB: recipCounts.B / recipTotal, probAB: recipCounts.AB / recipTotal};
  return result;
}

function calculatePairBloodDistributions(dataset) {
  var result = {};
  var recipCounts = {O: 0, A: 0, B: 0, AB: 0};
  var recipTotal = 0;
  var recipsSeen = {};
  var donorCounts = {O: {O: 0, A: 0, B: 0, AB: 0}, A: {O: 0, A: 0, B: 0, AB: 0}, B: {O: 0, A: 0, B: 0, AB: 0}, AB: {O: 0, A: 0, B: 0, AB: 0}, NDD: {O: 0, A: 0, B: 0, AB: 0}};
  var donorTotal = {O: 0, A: 0, B: 0, AB: 0, NDD: 0};
  for (var i = 0; i < dataset.getDonorCount() ; ++i) {
    var donor = dataset.getDonorAt(i);
    if (donor.sources.length > 1) {
      throw new Error('Only support sources of length at most 1');
    }
    if (donor.sources.length != 1) {
      // non-directed donor
      donorCounts.NDD[donor.bt.type] += 1;
      donorTotal.NDD += 1;
    } else {
      var patient = donor.sources[0];
      recipCounts[patient.bt.type] += 1;
      recipTotal += 1;
      donorCounts[patient.bt.type][donor.bt.type] += 1;
      donorTotal[patient.bt.type] += 1;
    }
  }
  result.donor = {
    O: {probO: donorCounts.O.O / donorTotal.O, probA: donorCounts.O.A / donorTotal.O, probB: donorCounts.O.B / donorTotal.O, probAB: donorCounts.O.AB / donorTotal.O},
    A: {probO: donorCounts.A.O / donorTotal.A, probA: donorCounts.A.A / donorTotal.A, probB: donorCounts.A.B / donorTotal.A, probAB: donorCounts.A.AB / donorTotal.A},
    B: {probO: donorCounts.B.O / donorTotal.B, probA: donorCounts.B.A / donorTotal.B, probB: donorCounts.B.B / donorTotal.B, probAB: donorCounts.B.AB / donorTotal.B},
    AB: {probO: donorCounts.AB.O / donorTotal.AB, probA: donorCounts.AB.A / donorTotal.AB, probB: donorCounts.AB.B / donorTotal.AB, probAB: donorCounts.AB.AB / donorTotal.AB},
    NDD: {probO: donorCounts.NDD.O / donorTotal.NDD, probA: donorCounts.NDD.A / donorTotal.NDD, probB: donorCounts.NDD.B / donorTotal.NDD, probAB: donorCounts.NDD.AB / donorTotal.NDD}
  };
  result.recip = {probO: recipCounts.O / recipTotal, probA: recipCounts.A / recipTotal, probB: recipCounts.B / recipTotal, probAB: recipCounts.AB / recipTotal};
  return result;
}

function scaleBt(type, current, actual, target) {
  current[type] *= Math.sqrt(target[type] / actual[type]);
}

function scaleBtDistribution(currentProbs, actualDistribution, targetDistribution) {
  var types = ["probO", "probA", "probB", "probAB"];
  var sum = 0;
  // Multiply each probability by (sqrt( target / current)). This will bring
  // the outputs closer in line with the desired inputs.
  for(var i = 0; i < types.length; ++i) {
    var type = types[i];
    if (actualDistribution[type] == 0) {
      currentProbs[type] += 0.01;
    } else {
      scaleBt(type, currentProbs, actualDistribution, targetDistribution);
    }
    sum += currentProbs[type];
  }
  // We need to rescale back to summing to 1
  for(var i = 0; i < types.length; ++i) {
    var type = types[i];
    currentProbs[type] *= 1/sum;
  }
}



function calculateDonorCountDistributions(dataset, maxDonors) {
  var recipTotal = 0;
  var recips = {};
  var recipIds = [];
  var recipSeens = {};
  for (var i = 0; i < dataset.getDonorCount() ; ++i) {
    var donor = dataset.getDonorAt(i);
    for (var p = 0; p < donor.sources.length; ++p) {
      var patient = donor.sources[p];
      // create if not found
      if (! recips.hasOwnProperty(patient.id)) {
        recips[patient.id] = 0;
        recipIds.push(patient.id);
      }
      recips[patient.id] += 1;
    }
  }
  var counts = [];
  for(var  i = 0 ; i < maxDonors; i += 1) {
    counts[i] = 0;
  }
  for (var id in recips) {
    counts[ recips[id] - 1] += 1;
  }
  // Turn back into probabilities
  for(var  i = 0 ; i < maxDonors; i += 1) {
    counts[i] = counts[i] / recipIds.length;
  }
  return counts;
}

function scaleDonors(index, current, actual, target) {
  current[index] *= Math.sqrt(target[index] / actual[index]);
}

function scaleDonorCountDistribution(currentProbs, actualDistribution, targetDistribution, maxDonors) {
  var sum = 0;
  // Multiply each probability by (sqrt( target / current)). This will bring
  // the outputs closer in line with the desired inputs.
  for(var i = 0; i < maxDonors; ++i) {
    if (actualDistribution[i] == 0) {
      currentProbs[i] += 0.01;
    } else {
      scaleDonors(i, currentProbs, actualDistribution, targetDistribution);
    }
    sum += currentProbs[i];
  }
  // We need to rescale back to summing to 1
  for(var i = 0; i < maxDonors; ++i) {
    currentProbs[i] *= 1/sum;
  }
}

function getPraDistribution(dataset, targetPra) {
  // First, get distribution of recipients according to the band
  var distrib = [];
  for (var i = 0; i < targetPra.length; ++i) {
    distrib.push(0);
  }
  for (var i = 0; i < dataset.getRecipCount() ; ++i) {
    var recip = dataset.getRecipAt(i);
    var crf = recip.crf;
    for (var j = 0; j < targetPra.length; ++j) {
      var band = targetPra[j];
      if (((band.minPra == band.maxPra) && (crf == band.minPra)) || ((band.minPra <= crf) && (crf < band.maxPra))) {
        distrib[j] += 1;
        break;
      }
    }
  }
  for (var i = 0; i < targetPra.length; ++i) {
    distrib[i] = distrib[i] / dataset.getRecipCount();
  }
  return distrib;
}

function getPraErrors(distribution, targetPra) {
  var errors = [];
  for (var i = 0; i < targetPra.length; ++i) {
    errors.push(Math.abs(distribution[i] - targetPra[i].prob));
  }
  return errors;
}

function scalePra(index, current, actual, target) {
  current[index].prob *= Math.sqrt(target[index].prob / actual[index]);
}

function scalePraDistribution(praBands, distribution, targetPra) {
  var sum = 0;
  for (var i = 0; i < targetPra.length; ++i) {
    if ((distribution[i] == 0) && (targetPra[i].prob > 0)) {
      praBands[i].prob += 0.01;
    } else {
      scalePra(i, praBands, distribution, targetPra);
    }
    sum += praBands[i].prob;
  }
  // We need to rescale back to summing to 1
  for(var i = 0; i < targetPra.length; ++i) {
    praBands[i].prob *= 1/sum;
  }
}

function getSplitPraDistribution(dataset, targetCompatPra, targetIncompatPra) {
  // First, get distribution of recipients according to the band
  var distrib = {};
  distrib.compat = [];
  distrib.incompat = [];
  for (var i = 0; i < targetCompatPra.length; ++i) {
    distrib.compat.push(0);
    distrib.incompat.push(0);
  }
  var compats = 0;
  var incompats = 0;
  for (var i = 0; i < dataset.getRecipCount() ; ++i) {
    var recip = dataset.getRecipAt(i);
    var crf = recip.crf;
    if (recip.hasBloodCompatibleDonor) {
      for (var j = 0; j < targetCompatPra.length; ++j) {
        var band = targetCompatPra[j];
        if (((band.minPra == band.maxPra) && (crf == band.minPra)) || ((band.minPra <= crf) && (crf < band.maxPra))) {
          distrib.compat[j] += 1;
          compats += 1;
          break;
        }
      }
    } else {
      for (var j = 0; j < targetIncompatPra.length; ++j) {
        var band = targetIncompatPra[j];
        if (((band.minPra == band.maxPra) && (crf == band.minPra)) || ((band.minPra <= crf) && (crf < band.maxPra))) {
          distrib.incompat[j] += 1;
          incompats += 1;
          break;
        }
      }
    }
  }
  for (var i = 0; i < targetCompatPra.length; ++i) {
    distrib.compat[i] = distrib.compat[i] / compats;
  }
  for (var i = 0; i < targetIncompatPra.length; ++i) {
    distrib.incompat[i] = distrib.incompat[i] / incompats;
  }
  return distrib;
}

function getSplitPraErrors(distributions, targetCompatPra, targetIncompatPra) {
  var errors = {};
  errors.compat = [];
  errors.incompat = [];
  for (var i = 0; i < targetCompatPra.length; ++i) {
    errors.compat.push(Math.abs(distributions.compat[i] - targetCompatPra[i].prob));
  }
  for (var i = 0; i < targetIncompatPra.length; ++i) {
    errors.incompat.push(Math.abs(distributions.incompat[i] - targetIncompatPra[i].prob));
  }
  return errors;
}

function TuneConfig(targetConfig, maxIter, maxError, tuneSize, tuneBloodtypes=true, tuneDonors=true, tunePRA=true) {
  var tuneNdds = targetConfig.numberOfAltruists != 0;
  var targetDonors = {...targetConfig.donorBtDistribution};
  var targetDonorsByPatient = {
    O: {...targetConfig.donorBtDistributionByPatientO},
    A: {...targetConfig.donorBtDistributionByPatientA},
    B: {...targetConfig.donorBtDistributionByPatientB},
    AB: {...targetConfig.donorBtDistributionByPatientAB},
    NDD: {...targetConfig.donorBtDistributionByPatientNDD}
  };
  var targetRecips = {...targetConfig.patientBtDistribution};
  var targetPra = parsePraBands(targetConfig.praBandsString);
  var targetCompatPra = parsePraBands(targetConfig.compatPraBandsString);
  var targetIncompatPra = parsePraBands(targetConfig.incompatPraBandsString);
  var targetDonorDist = {...targetConfig.donorCountProbabilities};
  var currentConfig = {...targetConfig};
  currentConfig.fullDetails = true; // Need to store recipient information to tune
  currentConfig.praBands = parsePraBands(targetConfig.praBandsString);
  currentConfig.compatPraBands = parsePraBands(targetConfig.compatPraBandsString);
  currentConfig.incompatPraBands = parsePraBands(targetConfig.incompatPraBandsString);
  var currentIter = 0;
  var biggestError;
  var btDistributions;
  var countDistributions;
  var praDistributions;
  var praError;
  var btErrors = {};
  var donorErrors;
  do {
    currentIter += 1;
    let gen = new KidneyGenerator(currentConfig);
    let dataset = gen.generateDataset(tuneSize,
                                      targetConfig.proportionAltruistic);
    var btError = 0;
    if (tuneBloodtypes) {
      if (currentConfig.donorBtDistributionByPatientO) {
        btDistributions = calculatePairBloodDistributions(dataset);
        btErrors.donor = {}
        btErrors.recip = [Math.abs(btDistributions.recip.probO - targetRecips.probO),
                          Math.abs(btDistributions.recip.probA - targetRecips.probA),
                          Math.abs(btDistributions.recip.probB - targetRecips.probB),
                          Math.abs(btDistributions.recip.probAB - targetRecips.probAB)];
        btErrors.donor.O = [Math.abs(btDistributions.donor.O.probO - targetDonorsByPatient.O.probO),
                            Math.abs(btDistributions.donor.O.probA - targetDonorsByPatient.O.probA),
                            Math.abs(btDistributions.donor.O.probB - targetDonorsByPatient.O.probB),
                            Math.abs(btDistributions.donor.O.probAB - targetDonorsByPatient.O.probAB)];
        btErrors.donor.A = [Math.abs(btDistributions.donor.A.probO - targetDonorsByPatient.A.probO),
                            Math.abs(btDistributions.donor.A.probA - targetDonorsByPatient.A.probA),
                            Math.abs(btDistributions.donor.A.probB - targetDonorsByPatient.A.probB),
                            Math.abs(btDistributions.donor.A.probAB - targetDonorsByPatient.A.probAB)];
        btErrors.donor.B = [Math.abs(btDistributions.donor.B.probO - targetDonorsByPatient.B.probO),
                            Math.abs(btDistributions.donor.B.probA - targetDonorsByPatient.B.probA),
                            Math.abs(btDistributions.donor.B.probB - targetDonorsByPatient.B.probB),
                            Math.abs(btDistributions.donor.B.probAB - targetDonorsByPatient.B.probAB)];
        btErrors.donor.AB = [Math.abs(btDistributions.donor.AB.probO - targetDonorsByPatient.AB.probO),
                             Math.abs(btDistributions.donor.AB.probA - targetDonorsByPatient.AB.probA),
                             Math.abs(btDistributions.donor.AB.probB - targetDonorsByPatient.AB.probB),
                             Math.abs(btDistributions.donor.AB.probAB - targetDonorsByPatient.AB.probAB)];
        if (tuneNdds) {
          btErrors.donor.NDD = [Math.abs(btDistributions.donor.NDD.probO - targetDonorsByPatient.NDD.probO),
                                Math.abs(btDistributions.donor.NDD.probA - targetDonorsByPatient.NDD.probA),
                                Math.abs(btDistributions.donor.NDD.probB - targetDonorsByPatient.NDD.probB),
                                Math.abs(btDistributions.donor.NDD.probAB - targetDonorsByPatient.NDD.probAB)];
        }
        scaleBtDistribution(currentConfig.donorBtDistributionByPatientO, btDistributions.donor.O,
          targetDonorsByPatient.O);
        scaleBtDistribution(currentConfig.donorBtDistributionByPatientA, btDistributions.donor.A,
          targetDonorsByPatient.A);
        scaleBtDistribution(currentConfig.donorBtDistributionByPatientB, btDistributions.donor.B,
          targetDonorsByPatient.B);
        scaleBtDistribution(currentConfig.donorBtDistributionByPatientAB, btDistributions.donor.AB,
          targetDonorsByPatient.AB);
        if (tuneNdds) {
          scaleBtDistribution(currentConfig.donorBtDistributionByPatientNDD, btDistributions.donor.NDD,
            targetDonorsByPatient.NDD);
        }
        scaleBtDistribution(currentConfig.patientBtDistribution, btDistributions.recip,
          targetRecips);
        if (tuneNdds) {
          btError = Math.max(...btErrors.recip, ...btErrors.donor.O, ...btErrors.donor.A, ...btErrors.donor.B, ...btErrors.donor.AB, ...btErrors.donor.NDD)
        } else {
          btError = Math.max(...btErrors.recip, ...btErrors.donor.O, ...btErrors.donor.A, ...btErrors.donor.B, ...btErrors.donor.AB)
        }
      } else {
        btDistributions = calculateBloodDistributions(dataset);

        btErrors.donor = [Math.abs(btDistributions.donor.probO - targetDonors.probO),
                          Math.abs(btDistributions.donor.probA - targetDonors.probA),
                          Math.abs(btDistributions.donor.probB - targetDonors.probB),
                          Math.abs(btDistributions.donor.probAB - targetDonors.probAB)];
        btErrors.recip = [Math.abs(btDistributions.recip.probO - targetRecips.probO),
                          Math.abs(btDistributions.recip.probA - targetRecips.probA),
                          Math.abs(btDistributions.recip.probB - targetRecips.probB),
                          Math.abs(btDistributions.recip.probAB - targetRecips.probAB)];
        scaleBtDistribution(currentConfig.donorBtDistribution, btDistributions.donor,
          targetDonors);
        scaleBtDistribution(currentConfig.patientBtDistribution, btDistributions.recip,
          targetRecips);

        btError = Math.max(...btErrors.donor, ...btErrors.recip);
      }
    }

    var donorError = 0;
    if (tuneDonors) {
      var maxDonors = currentConfig.donorCountProbabilities.length;
      countDistributions = calculateDonorCountDistributions(dataset, maxDonors);
      donorErrors = [];
      for(var i = 0; i < maxDonors; i += 1) {
        var err = Math.abs(countDistributions[i] - targetDonorDist[i]);
        donorErrors.push(err);
        donorError = Math.max(donorError, err);
      }
      scaleDonorCountDistribution(currentConfig.donorCountProbabilities, countDistributions,
        targetDonorDist, maxDonors);
    }
    var error = Math.max(donorError, btError);

    praError = 0;
    if (tunePRA) {
      if (targetCompatPra && targetIncompatPra) {
        praDistributions = getSplitPraDistribution(dataset, targetCompatPra, targetIncompatPra);
        praErrors = getSplitPraErrors(praDistributions, targetCompatPra, targetIncompatPra);
        scalePraDistribution(currentConfig.compatPraBands, praDistributions.compat, targetCompatPra);
        scalePraDistribution(currentConfig.incompatPraBands, praDistributions.incompat, targetIncompatPra);
        praError = Math.max(praError, ...praErrors.compat, ...praErrors.incompat)
      } else {
        praDistributions = getPraDistribution(dataset, targetPra);
        praErrors = getPraErrors(praDistributions, targetPra);
        scalePraDistribution(currentConfig.praBands, praDistributions, targetPra);
        praError = Math.max(...praErrors)
      }
    }
    error = Math.max(error, praError);
  } while (error > maxError && currentIter < maxIter);
  if (tuneBloodtypes) {
    if (targetConfig.donorBtDistributionByPatientO) {
      targetConfig.patientBtDistribution = currentConfig.patientBtDistribution;
      targetConfig.donorBtDistributionByPatientO = currentConfig.donorBtDistributionByPatientO;
      targetConfig.donorBtDistributionByPatientA = currentConfig.donorBtDistributionByPatientA;
      targetConfig.donorBtDistributionByPatientB = currentConfig.donorBtDistributionByPatientB;
      targetConfig.donorBtDistributionByPatientAB = currentConfig.donorBtDistributionByPatientAB;
      targetConfig.donorBtDistributionByPatientNDD = currentConfig.donorBtDistributionByPatientNDD;
      console.log("Recips  target\tactual\tprobs\terr");
      console.log("O:\t" + targetRecips.probO.toFixed(4) + "\t" + btDistributions.recip.probO.toFixed(4) + "\t" + currentConfig.patientBtDistribution.probO.toFixed(4) + "\t" + btErrors.recip[0].toFixed(4));
      console.log("\tDonors  target\tactual\tprobs\terr");
      console.log("\tO:\t" + targetDonorsByPatient.O.probO.toFixed(4) + "\t" + btDistributions.donor.O.probO.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientO.probO.toFixed(4) + "\t" + btErrors.donor.O[0].toFixed(4));
      console.log("\tA:\t" + targetDonorsByPatient.O.probA.toFixed(4) + "\t" + btDistributions.donor.O.probA.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientO.probA.toFixed(4) + "\t" + btErrors.donor.O[1].toFixed(4));
      console.log("\tB:\t" + targetDonorsByPatient.O.probB.toFixed(4) + "\t" + btDistributions.donor.O.probB.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientO.probB.toFixed(4) + "\t" + btErrors.donor.O[2].toFixed(4));
      console.log("\tAB:\t" + targetDonorsByPatient.O.probAB.toFixed(4) + "\t" + btDistributions.donor.O.probAB.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientO.probAB.toFixed(4) + "\t" + btErrors.donor.O[3].toFixed(4));
      console.log("A:\t" + targetRecips.probA.toFixed(4) + "\t" + btDistributions.recip.probA.toFixed(4) + "\t" + currentConfig.patientBtDistribution.probA.toFixed(4) + "\t" + btErrors.recip[1].toFixed(4));
      console.log("\tDonors  target\tactual\tprobs\terr");
      console.log("\tO:\t" + targetDonorsByPatient.A.probO.toFixed(4) + "\t" + btDistributions.donor.A.probO.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientA.probO.toFixed(4) + "\t" + btErrors.donor.A[0].toFixed(4));
      console.log("\tA:\t" + targetDonorsByPatient.A.probA.toFixed(4) + "\t" + btDistributions.donor.A.probA.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientA.probA.toFixed(4) + "\t" + btErrors.donor.A[1].toFixed(4));
      console.log("\tB:\t" + targetDonorsByPatient.A.probB.toFixed(4) + "\t" + btDistributions.donor.A.probB.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientA.probB.toFixed(4) + "\t" + btErrors.donor.A[2].toFixed(4));
      console.log("\tAB:\t" + targetDonorsByPatient.A.probAB.toFixed(4) + "\t" + btDistributions.donor.A.probAB.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientA.probAB.toFixed(4) + "\t" + btErrors.donor.A[3].toFixed(4));
      console.log("B:\t" + targetRecips.probB.toFixed(4) + "\t" + btDistributions.recip.probB.toFixed(4) + "\t" + currentConfig.patientBtDistribution.probB.toFixed(4) + "\t" + btErrors.recip[2].toFixed(4));
      console.log("\tDonors  target\tactual\tprobs\terr");
      console.log("\tO:\t" + targetDonorsByPatient.B.probO.toFixed(4) + "\t" + btDistributions.donor.B.probO.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientB.probO.toFixed(4) + "\t" + btErrors.donor.B[0].toFixed(4));
      console.log("\tA:\t" + targetDonorsByPatient.B.probA.toFixed(4) + "\t" + btDistributions.donor.B.probA.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientB.probA.toFixed(4) + "\t" + btErrors.donor.B[1].toFixed(4));
      console.log("\tB:\t" + targetDonorsByPatient.B.probB.toFixed(4) + "\t" + btDistributions.donor.B.probB.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientB.probB.toFixed(4) + "\t" + btErrors.donor.B[2].toFixed(4));
      console.log("\tAB:\t" + targetDonorsByPatient.B.probAB.toFixed(4) + "\t" + btDistributions.donor.B.probAB.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientB.probAB.toFixed(4) + "\t" + btErrors.donor.B[3].toFixed(4));
      console.log("AB:\t" + targetRecips.probAB.toFixed(4) + "\t" + btDistributions.recip.probAB.toFixed(4) + "\t" + currentConfig.patientBtDistribution.probAB.toFixed(4) + "\t" + btErrors.recip[3].toFixed(4));
      console.log("\tDonors  target\tactual\tprobs\terr");
      console.log("\tO:\t" + targetDonorsByPatient.AB.probO.toFixed(4) + "\t" + btDistributions.donor.AB.probO.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientAB.probO.toFixed(4) + "\t" + btErrors.donor.AB[0].toFixed(4));
      console.log("\tA:\t" + targetDonorsByPatient.AB.probA.toFixed(4) + "\t" + btDistributions.donor.AB.probA.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientAB.probA.toFixed(4) + "\t" + btErrors.donor.AB[1].toFixed(4));
      console.log("\tB:\t" + targetDonorsByPatient.AB.probB.toFixed(4) + "\t" + btDistributions.donor.AB.probB.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientAB.probB.toFixed(4) + "\t" + btErrors.donor.AB[2].toFixed(4));
      console.log("\tAB:\t" + targetDonorsByPatient.AB.probAB.toFixed(4) + "\t" + btDistributions.donor.AB.probAB.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientAB.probAB.toFixed(4) + "\t" + btErrors.donor.AB[3].toFixed(4));
      if (tuneNdds) {
        console.log("NDDonors target\tactual\tprobs\terr");
        console.log("O:\t" + targetDonorsByPatient.NDD.probO.toFixed(4) + "\t" + btDistributions.donor.NDD.probO.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientNDD.probO.toFixed(4) + "\t" + btErrors.donor.NDD[0].toFixed(4));
        console.log("A:\t" + targetDonorsByPatient.NDD.probA.toFixed(4) + "\t" + btDistributions.donor.NDD.probA.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientNDD.probA.toFixed(4) + "\t" + btErrors.donor.NDD[1].toFixed(4));
        console.log("B:\t" + targetDonorsByPatient.NDD.probB.toFixed(4) + "\t" + btDistributions.donor.NDD.probB.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientNDD.probB.toFixed(4) + "\t" + btErrors.donor.NDD[2].toFixed(4));
        console.log("AB:\t" + targetDonorsByPatient.NDD.probAB.toFixed(4) + "\t" + btDistributions.donor.NDD.probAB.toFixed(4) + "\t" + currentConfig.donorBtDistributionByPatientNDD.probAB.toFixed(4) + "\t" + btErrors.donor.NDD[3].toFixed(4));
      }
    } else {
      targetConfig.donorBtDistribution = currentConfig.donorBtDistribution;
      targetConfig.patientBtDistribution = currentConfig.patientBtDistribution;
      console.log("Donors  target\tactual\tprobs\terr");
      console.log("O:\t" + targetDonors.probO.toFixed(4) + "\t" + btDistributions.donor.probO.toFixed(4) + "\t" + currentConfig.donorBtDistribution.probO.toFixed(4) + "\t" + btErrors.donor[0].toFixed(4));
      console.log("A:\t" + targetDonors.probA.toFixed(4) + "\t" + btDistributions.donor.probA.toFixed(4) + "\t" + currentConfig.donorBtDistribution.probA.toFixed(4) + "\t" + btErrors.donor[1].toFixed(4));
      console.log("B:\t" + targetDonors.probB.toFixed(4) + "\t" + btDistributions.donor.probB.toFixed(4) + "\t" + currentConfig.donorBtDistribution.probB.toFixed(4) + "\t" + btErrors.donor[2].toFixed(4));
      console.log("AB:\t" + targetDonors.probAB.toFixed(4) + "\t" + btDistributions.donor.probAB.toFixed(4) + "\t" + currentConfig.donorBtDistribution.probAB.toFixed(4) + "\t" + btErrors.donor[3].toFixed(4));
      console.log("Recips  target\tactual\tprobs\terr");
      console.log("O:\t" + targetRecips.probO.toFixed(4) + "\t" + btDistributions.recip.probO.toFixed(4) + "\t" + currentConfig.patientBtDistribution.probO.toFixed(4) + "\t" + btErrors.recip[0].toFixed(4));
      console.log("A:\t" + targetRecips.probA.toFixed(4) + "\t" + btDistributions.recip.probA.toFixed(4) + "\t" + currentConfig.patientBtDistribution.probA.toFixed(4) + "\t" + btErrors.recip[1].toFixed(4));
      console.log("B:\t" + targetRecips.probB.toFixed(4) + "\t" + btDistributions.recip.probB.toFixed(4) + "\t" + currentConfig.patientBtDistribution.probB.toFixed(4) + "\t" + btErrors.recip[2].toFixed(4));
      console.log("AB:\t" + targetRecips.probAB.toFixed(4) + "\t" + btDistributions.recip.probAB.toFixed(4) + "\t" + currentConfig.patientBtDistribution.probAB.toFixed(4) + "\t" + btErrors.recip[3].toFixed(4));
    }
  }
  if (tuneDonors) {
    targetConfig.donorCountProbabilities = currentConfig.donorCountProbabilities;
    console.log("Donor counts\ttarget\tactual\tprobs\terr");
    for(var j = 0; j < currentConfig.donorCountProbabilities.length; ++j) {
      console.log("" + j + ":\t\t" + targetDonorDist[j].toFixed(4) + "\t" + countDistributions[j].toFixed(4) + "\t" + currentConfig.donorCountProbabilities[j].toFixed(4) + "\t" + donorErrors[j].toFixed(4));
    }
  }
  if (tunePRA) {
    if (targetCompatPra && targetIncompatPra) {
      targetConfig.compatPraBands = currentConfig.compatPraBands;
      console.log("Compatible pairs");
      console.log("Band\t\ttarget\tactual\tprobs\terr");
      for(var j = 0; j < targetCompatPra.length; ++j) {
        const band = targetCompatPra[j];
        console.log("" + band.minPra.toFixed(2) + "-" + band.maxPra.toFixed(2) + "\t" + band.prob.toFixed(4) + "\t" + praDistributions.compat[j].toFixed(4) + "\t" + currentConfig.compatPraBands[j].prob.toFixed(4) + "\t" + praErrors.compat[j].toFixed(4));
      }
      targetConfig.incompatPraBands = currentConfig.incompatPraBands;
      console.log("Incompatible pairs");
      console.log("Band\t\ttarget\tactual\tprobs\terr");
      for(var j = 0; j < targetIncompatPra.length; ++j) {
        const band = targetIncompatPra[j];
        console.log("" + band.minPra.toFixed(2) + "-" + band.maxPra.toFixed(2) + "\t" + band.prob.toFixed(4) + "\t" + praDistributions.incompat[j].toFixed(4) + "\t" + currentConfig.incompatPraBands[j].prob.toFixed(4) + "\t" + praErrors.incompat[j].toFixed(4));
      }
    } else {
      targetConfig.praBands = currentConfig.praBands;
      console.log("All pairs");
      console.log("Band\t\ttarget\tactual\tprobs\terr");
      for(var j = 0; j < targetPra.length; ++j) {
        const band = targetPra[j];
        console.log("" + band.minPra.toFixed(2) + "-" + band.maxPra.toFixed(2) + "\t" + band.prob.toFixed(4) + "\t" + praDistributions[j].toFixed(4) + "\t" + currentConfig.praBands[j].prob.toFixed(4) + "\t" + praErrors[j].toFixed(4));
      }
    }
  }
  console.log("After "  + currentIter + " iterations, the biggest error is " +error);
  return targetConfig;
}
