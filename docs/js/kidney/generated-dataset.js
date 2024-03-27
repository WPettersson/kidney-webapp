function GeneratedDataset() {
  this.data = [];
  this.recipients = [];
}

GeneratedDataset.prototype.readInputString = function(s) {
  var tokens = s.split(/\s+/);
  var i=0;
  var next = function() { return +tokens[i++]; };
  var nPairs = next();
  var patientLookup = new PatientLookup();
  var donors
  for (var j=0; j<nPairs; j++) {
    var donor = new Donor(j, 50, undefined, false);
    donor.addSource(patientLookup.getOrCreate(j));
    this.addDonor(donor);
  }
  var nEdges = next();
  var origin;
  while ((origin = next()) != -1) {
    dest = next();
    score = next();
    this.getDonorAt(origin).addMatch({
      recipient: patientLookup.getOrCreate(dest),
      score: score
    });
  }
};

GeneratedDataset.prototype.readJsonString = function(s) {
  var d = JSON.parse(s).data;
  var patientLookup = new PatientLookup();
  for (var donorId in d) {
    if (d.hasOwnProperty(donorId)) {
      var dd = d[donorId];
      var donor = new Donor(+donorId, dd.dage, undefined, !!dd.altruistic);
      //console.log(donor);
      if (dd.sources) {
        dd.sources.forEach(function(source) {
          donor.addSource(patientLookup.getOrCreate(source));
        });
      }
      if (dd.matches) {
        dd.matches.forEach(function(match) {
          donor.addMatch(
              {recipient:patientLookup.getOrCreate(match.recipient), score:match.score});
        });
      }
      this.addDonor(donor);
    }
  }
};

GeneratedDataset.prototype.readXmlString = function(s) {
  var d = xmlToJson($.parseXML(s)).data.entry;
  console.log(d);
  if (!$.isArray(d)) d = [d];
  var patientLookup = new PatientLookup();
  for (var i=0; i<d.length; i++) {
    var dd = d[i];
    var donorId = dd["@attributes"].donor_id;
    var altruistic = dd.altruistic && dd.altruistic["#text"]==="true";
    var donor = new Donor(+donorId, +dd.dage["#text"], undefined, altruistic);
    //console.log(donor);
    if (dd.sources && dd.sources.source) {
      if (!$.isArray(dd.sources.source)) dd.sources.source = [dd.sources.source];
      dd.sources.source.forEach(function(source) {
        donor.addSource(patientLookup.getOrCreate(+source["#text"]));
      });
    }
    if (dd.matches && dd.matches.match) {
      if (!$.isArray(dd.matches.match)) dd.matches.match = [dd.matches.match];
      dd.matches.match.forEach(function(match) {
        donor.addMatch(
            {
               recipient:patientLookup.getOrCreate(+match.recipient["#text"]),
               score:+match.score["#text"]
            });
      });
    }
    this.addDonor(donor);
  }
};

GeneratedDataset.prototype.addRecipient = function(recipient) {
  this.recipients.push(recipient);
};

GeneratedDataset.prototype.addDonor = function(donor) {
  this.data.push(donor);
};
GeneratedDataset.prototype.toCompactString = function() {
  var tokens = [];
  for (var i=0; i<this.data.length; i++) {
    var donor = this.getDonorAt(i);
    tokens.push(donor.id);
    tokens.push(donor.isAltruistic ? 1 : 0);
    tokens.push(donor.dage);
    if (!donor.isAltruistic) {
      tokens.push(donor.sources.length);
      donor.sources.forEach(function(d) {
        tokens.push(d.id);
      });
    }
    tokens.push(donor.matches.length);
    donor.matches.forEach(function(d) {
      tokens.push(d.recipient.id);
      tokens.push(d.score);
    });
  }
  return tokens.join(" ");
}
GeneratedDataset.prototype.toJsonString = function(fullDetails) {
  var dataObj = {};
  for (var i=0; i<this.data.length; i++) {
    var donor = this.getDonorAt(i);
    var donorObj = {};
    if (donor.isAltruistic) {
      donorObj.altruistic = true;
    } else {
      donorObj.sources = donor.sources.map(function(d) {
        return d.id;
      });
    }
    donorObj.dage = donor.dage;
    if (donor.matches.length > 0) {
      donorObj.matches = donor.matches.map(function(d) {
        return {recipient: d.recipient.id, score: d.score};
      });
    }
    if (fullDetails) {
      donorObj.bloodtype = donor.bt.type;
    }
    dataObj[""+donor.id] = donorObj;
  }
  var serializedObj = {data: dataObj};
  if (fullDetails) {
    var recipsObj = {};
    for (var i=0; i < this.recipients.length; i++) {
      var recipObj = {};
      recipObj.cPRA = this.recipients[i].crf;
      recipObj.bloodtype = this.recipients[i].bt.type;
      recipObj.hasBloodCompatibleDonor = this.recipients[i].hasBloodCompatibleDonor;
      recipsObj[""+this.recipients[i].id] = recipObj;
    }
    serializedObj.recipients = recipsObj;
  }
  return JSON.stringify(serializedObj, undefined, 2);
}
GeneratedDataset.prototype.createXmlNode = function(doc, n, t) {
  var node = doc.createElement(n);
  var textNode = doc.createTextNode(t);
  node.appendChild(textNode);
  return node;
}
GeneratedDataset.prototype.toXmlString = function(fullDetails) {
  var self = this;
  var doc = document.implementation.createDocument(null, null, null);
  var dataNode = doc.createElement("data");
  for (var i=0; i<this.data.length; i++) {
    var donor = this.getDonorAt(i);
    var donorNode = doc.createElement("entry");
    donorNode.setAttribute("donor_id", donor.id);
    if (donor.isAltruistic) {
      donorNode.appendChild(
          this.createXmlNode(doc, "altruistic", "true"));
    }
    donorNode.appendChild(
        this.createXmlNode(doc, "dage", ""+donor.dage));
    if (!donor.isAltruistic) {
      var sourcesNode = doc.createElement("sources");
      donor.sources.forEach(function(d) {
        sourcesNode.appendChild(
            self.createXmlNode(doc, "source", ""+d.id));
      });
      donorNode.appendChild(sourcesNode);
    }
    if (donor.matches.length > 0) {
      var matchesNode = doc.createElement("matches");
      donor.matches.forEach(function(d) {
        var matchNode = doc.createElement("match");
        matchNode.appendChild(
            self.createXmlNode(doc, "recipient", d.recipient.id));
        matchNode.appendChild(
            self.createXmlNode(doc, "score", d.score));
        matchesNode.appendChild(matchNode);
      });
      donorNode.appendChild(matchesNode);
    }
    if (fullDetails) {
      donorNode.setAttribute("bloodtype", donor.bt.type);
    }
    dataNode.appendChild(donorNode); 
  }
  doc.appendChild(dataNode);
  // Not sure how to insert this into XML, we cannot do another
  // doc.appendChild() as a document can only have one child.
  if (false && fullDetails) {
    var recipsObj = doc.createElement("recipients");
    for (var i=0; i < this.recipients.length; i++) {
      var recip = this.recipients[i];
      var recipObj = doc.createElement("recipient");
      recipObj.setAttribute("recip_id", recip.id);
      recipObj.setAttribute("cPRA", recip.crf);
      recipObj.setAttribute("bloodtype", recip.bt.type);
      recipObj.setAttribute("hasBloodCompatibleDonor", recip.hasBloodCompatibleDonor);
      recipsObj.appendChild(recipObj);
    }
    doc.appendChild(recipsObj)
  }
  return (new XMLSerializer()).serializeToString(doc);
}
GeneratedDataset.prototype.getDonorCount = function() {
  return this.data.length;
}
GeneratedDataset.prototype.getDonorAt = function(index) {
  return this.data[index];
}

GeneratedDataset.prototype.getRecipCount = function() {
  return this.recipients.length;
}
GeneratedDataset.prototype.getRecipAt = function(index) {
  return this.recipients[index];
}
