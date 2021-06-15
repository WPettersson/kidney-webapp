function KidneyGenerator(genConfig) {
  this.genConfig = genConfig;
  if (genConfig.praBands) {
    this.praBands = genConfig.praBands;
  } else if (genConfig.praBandsString) {
    this.praBands = parsePraBands(genConfig.praBandsString);
  }
  if (genConfig.compatPraBands) {
    this.compatPraBands = genConfig.compatPraBands;
  } else if (genConfig.compatPraBandsString) {
    console.log("Parsing new compat band")
    this.compatPraBands = parsePraBands(genConfig.compatPraBandsString)
  }
  if (genConfig.incompatPraBands) {
    this.incompatPraBands = genConfig.incompatPraBands;
  } else if (genConfig.incompatPraBandsString) {
    this.incompatPraBands = parsePraBands(genConfig.incompatPraBandsString);
  }
  if (genConfig.compatBandsString) {
    this.compatBands = parseCompatBands(genConfig.compatBandsString);
  } else {
    // The possibility of a positive crossmatch is correlated with the cPRA level
    // of a recipient. However, it is also not as simple as
    // Prob(crossmatch) = cPRA
    // We instead model it as Prob(crossmatch) = praIntercept + praMultiplier * cPRA
    praMultiplier = genConfig.praMultiplier || 1;
    praIntercept = genConfig.praIntercept || 0;
    this.compatBands = [new CompatBand(0, 101, praIntercept, praMultiplier, 1)];
  }
  if (this.genConfig.probAdjustmentNDDBands) {
    this.NDDBands = new NDDBands(this.genConfig.probAdjustmentNDDBands);
  }
  console.log("Constructed a KidneyGenerator");
}

KidneyGenerator.prototype.drawDonorBt = function(recipientBt) {
  if (this.genConfig.donorBtDistributionByPatientO) {
    if (recipientBt == "O") {
      return this.genConfig.donorBtDistributionByPatientO.draw();
    } else if (recipientBt == "A") {
      return this.genConfig.donorBtDistributionByPatientA.draw();
    } else if (recipientBt == "B") {
      return this.genConfig.donorBtDistributionByPatientB.draw();
    } else if (recipientBt == "AB") {
      return this.genConfig.donorBtDistributionByPatientAB.draw();
    } else if (recipientBt == "NDD") {
      return this.genConfig.donorBtDistributionByPatientNDD.draw();
    }
  }
  return this.genConfig.donorBtDistribution.draw()
}

function parseCompatBands(s) {
  var bandStrings = s.split(/\r\n|\r|\n/g);
  var retVal = [];
  for (var i=0; i<bandStrings.length; i++) {
    var bandString = bandStrings[i];
    if (bandString) {
      var tokens = bandString.split(/ +/);
      if (!tokens[3]) tokens[3] = 0;
      if (!tokens[4]) tokens[4] = 1;
      // lowPRAbound, highPRAbound, intercept, multiplier, isNDDCost
      retVal.push(new CompatBand(tokens[0], tokens[1], tokens[2], tokens[3], tokens[4]));
    }
  }
  return retVal;
}


function parsePraBands(s) {
  if (s === undefined) {
    return undefined;
  }
  var bandStrings = s.split(/\r\n|\r|\n/g);
  var retVal = [];
  for (var i=0; i<bandStrings.length; i++) {
    var bandString = bandStrings[i];
    if (bandString) {
      var tokens = bandString.split(/ +/);
      if (!tokens[2]) tokens[2] = tokens[1];
      retVal.push(new PraBand(+tokens[0], +tokens[1], +tokens[2]));
    }
  }
  return retVal;
}

KidneyGenerator.prototype.generateDataset = function(
    numGroupsToGenerate, proportionOfDonorsAltruistic) {
  
  var generatedDataset = new GeneratedDataset();
  // this.incompatiblePairs = [];
  // this.compatiblePairs = [];
  patientList = [];

  var patientId = 0;
  var donorId = 0;

  var nGroupsGenerated = 0;
  while (nGroupsGenerated < numGroupsToGenerate) {
    var nDonors = this.generateNumberOfDonors();
    var donors = [];
    var patient = new Patient(patientId++);
    patient.bt = this.genConfig.patientBtDistribution.draw();
    patient.hasBloodCompatibleDonor = false;
    for (var i=0; i<nDonors; i++) {
      donors[i] = new Donor(
        donorId++,
        this.drawDage(),
        this.drawDonorBt(patient.bt.type),
        false
      );
      if (patient.bt.compatibleWith(donors[i].bt)) {
        patient.hasBloodCompatibleDonor = true;
      }
    }
    
    patient.isWife = this.drawIsWife();
    patient.crf = this.drawCrf(patient.isWife, patient.hasBloodCompatibleDonor);

    // Add compatBand to the patient object, for easy future access
    for (var i = 0; i < this.compatBands.length; i++) {
      var band = this.compatBands[i];
      if ((band.lowPra <= patient.crf) && (patient.crf < band.highPra)) {
        patient.compatBand = band;
        break;
      }
    }
    if (! patient.compatBand) {
      for (var i = 0; i < this.compatBands.length; i++) {
        var band = this.compatBands[i];
        console.log("band " + i + " has low " + band.lowPra + " and high " + band.highPra);
      }
      throw new Error("No compatBand found for PRA = " + patient.crf);
    }
    
    // foundAMatch tell us whether there are any
    // donor-patient matches within this group consisting of
    // a patient and his or her paired donors
    var foundAMatch = false;
    
    for (var i = 0; i < nDonors; i++) {
      var donor = donors[i];
      foundAMatch = foundAMatch || patient.compatibleWith(donor);
      donor.addSource(patient);
    }
    
    if (this.genConfig.assumePairsIncompatible || !foundAMatch) {
      nGroupsGenerated++;
      for (var i = 0; i < nDonors; i++) {
        generatedDataset.addDonor(donors[i]);
      }
      patientList.push(patient);
      generatedDataset.addRecipient(patient);
    }
  }

  for (var i=0; i<patientList.length; i++) {
    var patient = patientList[i];
    for (var j=0; j<generatedDataset.getDonorCount(); j++) {
      var donor = generatedDataset.getDonorAt(j);
      if (!donor.hasSource(patient) && patient.compatibleWith(donor)) {
        donor.addMatch({recipient: patient, score: this.drawScore()});
      }
    }
  }
    
  var nAltruisticGenerated = 0;
  var nAltruisticToGenerate = this.genConfig.numberOfAltruists || (Math.round(generatedDataset.getDonorCount()
      * proportionOfDonorsAltruistic
      / (1 - proportionOfDonorsAltruistic)));
  
  
  while (nAltruisticGenerated < nAltruisticToGenerate) {
    var altruisticDonor = new Donor(
      donorId,
      this.drawDage(),
      this.drawDonorBt("NDD"),
      true
    );
    if (this.NDDBands) {
      altruisticDonor.probAdjustmentNDD = this.NDDBands.getAdjustment()
    } else {
      altruisticDonor.probAdjustmentNDD = this.genConfig.probAdjustmentNDD || 1;
    }
    var atLeastOneMatchFound = false;
    for (var i=0; i<patientList.length; i++) {
      var patient = patientList[i];
      if (patient.compatibleWith(altruisticDonor)) {
        atLeastOneMatchFound = true;
        altruisticDonor.addMatch(
            {recipient: patient, score: this.drawScore()});
      }
    }
    if (atLeastOneMatchFound) {
      generatedDataset.addDonor(altruisticDonor);
      nAltruisticGenerated++;
      donorId++;
    }
  }
  return generatedDataset;
};

KidneyGenerator.prototype.drawDage = function() {
  return 18 + (Math.floor(Math.random() * 51));
};

KidneyGenerator.prototype.drawScore = function() {
  return Math.floor(Math.random() * 90);
};

KidneyGenerator.prototype.drawIsWife = function() {
  var probFemale = this.genConfig.probFemale;
  var probSpousalDonor = this.genConfig.probSpousal;
  return (Math.random() <= probFemale && Math.random() <= probSpousalDonor);
};

KidneyGenerator.prototype.drawCrf = function(isWife, hasBloodCompatibleDonor) {
  var crf = -1;
  var r = Math.random();
  var cumulativePraProb = 0;

  var band = this.praBands;
  if (hasBloodCompatibleDonor && this.compatPraBands) {
    band = this.compatPraBands;
  }
  if (!hasBloodCompatibleDonor && this.incompatPraBands) {
    band = this.incompatPraBands;
  }
  // Check if r is less than the cumulative probability of
  // PRA values 0,...,i.
  for (var i = 0; i < band.length; i++) {
    var praBand = band[i];
    cumulativePraProb += praBand.prob;
    if (r <= cumulativePraProb || (i === band.length - 1)) {
      if (praBand.minPra === praBand.maxPra) {
        crf = praBand.minPra;
      } else {
        var r2 = Math.random();
        crf = praBand.minPra + r2 * (praBand.maxPra - praBand.minPra);
      }
      break;
    }
  }
  if (!isWife) {
    return crf;
  } else {
    return 1 - this.genConfig.probSpousalPraCompatibility * (1 - crf);
  }
};

KidneyGenerator.prototype.generateNumberOfDonors = function() {
  if (this.genConfig.donorCountProbabilities[0] === 1) {
    return 1;
  }
  var cumulativeProb = 0;
  var r = Math.random();
  for (var i = 0; i < this.genConfig.donorCountProbabilities.length; i++) {
    cumulativeProb += this.genConfig.donorCountProbabilities[i];
    if (r <= cumulativeProb) {
      return i + 1;
    }
  }
  // This shouldn't be reached, except in the case of a
  // floating-point arithmetic imprecision
  return this.genConfig.donorCountProbabilities.length;
};
