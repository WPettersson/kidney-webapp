function BloodType(type) {
  this.type = type;
}
BloodType.prototype.compatibleWith = function(donorType) {
  return donorType.type==="O" ||
    this.type==="AB" ||
    donorType.type===this.type;
}

function BloodTypeDistribution(probO, probA, probB, probAB) {
  this.probO = probO;
  this.probA = probA;
  this.probB = probB;
  this.probAB = probAB;
}

BloodTypeDistribution.prototype.draw = function() {
  var r = Math.random();
  if (r <= this.probO)
    return new BloodType("O");
  if (r <= this.probO + this.probA)
    return new BloodType("A");
  if (r <= this.probO + this.probA + this.probB)
    return new BloodType("B");
  return new BloodType("AB");
}
