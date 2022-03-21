// @Eric_PHILIPPE(2022)
// All of this code is done in order to works with the API and
// Follow an Excel Document Calcul doing all of this

const { sum } = require("lodash");
const Blocs = require("./api-visunotes/api-VisuNotes-Toulouse3-master/Blocs");

const coeff = require("./notes.json"); // Coeff ressources
const coeffMoyennes = coeff.coeffMoyennes;
const coeffBlocsWithoutSAE = coeff.coeffBlocsWithoutSAE;

/** Calculator linked to the Notes API */
module.exports = class Calculator {
  /**
   * Constructor of the Calcultator object
   * @param {Array<Blocs>} Blocs
   */
  constructor(Blocs) {
    this.subjectsMoyennes = [];
    this.blocsMoyennesNoSAE = [];
    this.blocsFinal = [];
    this.Blocs = Blocs;
    this.__init__();
  }

  /**
   * Init all the objects of the call if Blocs are given and valid
   */
  __init__() {
    if (this.Blocs) {
      this.buildSubjectsMoyennes();
      this.buildMoyennesPerBloc();
      this.buildMoyennesBlocs();
    }
  }

  /**
   * Build all the Moyenne per subjects
   */
  buildSubjectsMoyennes() {
    // Loop all around the indexes of each Subjects
    for (let i = 0; i < coeffMoyennes.length; i++) {
      let effectiveCoeff = []; // A user can be Absent so coeff will not be effective
      let effectiveArgs = []; // Same for the notes
      // Loop all around the required notes
      for (let j = 0; j < this.Blocs[i].notes.length; j++) {
        let int = 10; // Get the default note
        // Check if the notes exists or need to be default
        if (this.Blocs[i].notes[j].result >= 0) {
          int = this.Blocs[i].notes[j].result;
        }
        let args = int * coeffMoyennes[i].coeff[j];
        // Put everything into the corresponding array
        if (args) {
          effectiveCoeff.push(coeffMoyennes[i].coeff[j]);
          effectiveArgs.push(args);
        }
      }
      // If at least it exists one notes
      if (effectiveArgs.length > 0) {
        // Average calcul function
        this.subjectsMoyennes.push(
          this.calculMoyenne(effectiveCoeff, effectiveArgs)
        );
      } else {
        // ABI State
        this.subjectsMoyennes.push("ABI");
      }
    }
  }

  /**
   * Build all the Bloc average marks with the calculated first marks
   */
  buildMoyennesPerBloc() {
    if (this.subjectsMoyennes.length === 0) return; // Safety
    // Loop around all the coeff no SAE objects
    for (let i = 0; i < coeffBlocsWithoutSAE.length; i++) {
      let effectiveCoeff = []; // Init effective coeff
      let effectiveArgs = []; // Init effective Args
      // Loop all around the indexes
      for (let j = 0; j < coeffBlocsWithoutSAE[i].index.length; j++) {
        // If the user isn't in a ABI state "Unjustified Absence"
        if (!isNaN(this.subjectsMoyennes[j])) {
          let args =
            this.subjectsMoyennes[coeffBlocsWithoutSAE[i].index[j]] *
            coeffBlocsWithoutSAE[i].coeff[j]; // Calcul all the marks with their corresponding coeff'
          if (args) {
            effectiveCoeff.push(coeffBlocsWithoutSAE[i].coeff[j]);
            effectiveArgs.push(args);
          }
        }
      }
      // Check if the user partipated to at least one exam
      if (effectiveArgs.length > 0) {
        let sommeArgs = sum(effectiveArgs); // Final Sum of marks
        let sommeCoeff = sum(effectiveCoeff); // Final sum of effective coeff'
        this.blocsMoyennesNoSAE.push(
          this.normalizeBlocsNoSAE(sommeArgs, sommeCoeff) // Normalize each average marks by the default coeff
        );
      } else {
        // Default
        this.blocsMoyennesNoSAE.push("ABI");
      }
    }

    this.blocsMoyennesNoSAE = this.affineArray(this.blocsMoyennesNoSAE); // Get two value after the ,
  }

  /**
   * Normalize each average marks by the default coeff
   */
  buildMoyennesBlocs() {
    // Safety of the last process
    if (this.blocsMoyennesNoSAE.length === 0) return;
    if (this.subjectsMoyennes.length === 0) return;

    let blocsFinal = [];
    for (let i = 0; i < this.blocsMoyennesNoSAE.length; i++) {
      let moyenneNoSAE = this.blocsMoyennesNoSAE[i]; // Refer to the older builder
      let gradeSAE = this.Blocs[coeffMoyennes.length - 1 + i].notes[0].result; // SAE Result
      let gradePF = this.Blocs[this.Blocs.length - 1].notes[0].result; // Portfolio Subject is independant of everything
      if (gradeSAE === -1) gradeSAE = 10; // No marks given
      if (gradePF === -1) gradePF = 10; // No marks given

      blocsFinal.push(
        moyenneNoSAE +
          gradeSAE * coeff.COEFF_BY_SAE +
          gradePF * coeff.COEFF_FOLIO
      );
    }

    this.blocsFinal = this.affineArray(blocsFinal);
  }

  /**
   * Return the average note with all the effective marks
   * @param {Array<Number>} effectiveCoeff
   * @param {Array<Number>} effectiveArgs
   * @return {Number}
   */
  calculMoyenne(effectiveCoeff, effectiveArgs) {
    return sum(effectiveArgs) / sum(effectiveCoeff);
  }

  /**
   * Give the number with two numbers after the coma for the SAE average note
   * @param {Array<Number>} sommeArgs
   * @param {Array<Number>} sommeCoeff
   * @return {Number}
   */
  normalizeBlocsNoSAE(sommeArgs, sommeCoeff) {
    return (sommeArgs * 60) / sommeCoeff / 100;
  }

  /**
   * Give the number with two numbers after the coma
   * @param {Array<Number>} array
   */
  affineArray(array) {
    let cleanArray = [];
    for (let i = 0; i < array.length; i++) {
      cleanArray.push(Math.round(array[i] * 100) / 100);
    }
    return cleanArray;
  }

  /**
   * Getter of the Averagne Marks
   * @return {Array<Number>}
   */
  getMoyennes() {
    return this.subjectsMoyennes;
  }

  /**
   * Getter of the average SAE makrs
   * @return {Array<Number>}
   */
  getBlocsWithoutSAE() {
    return this.blocsMoyennesNoSAE;
  }

  /**
   * Getter of the Final Bloc Array
   * @return {Array<Number>}
   */
  getFinalBlocs() {
    return this.blocsFinal;
  }
};
