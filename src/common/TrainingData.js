import { rapidmixDocVersion, rapidmixDefaultLabel } from '../common/constants';

// source : https://stackoverflow.com/questions/15251879/how-to-check-if-a-variable-is-a-typed-array-in-javascript
const isArray = v => {
  return v.constructor === Float32Array ||
         v.constructor === Float64Array ||
         Array.isArray(v);
};

//================================== PHRASE ==================================//

/**
 * Class modeling a phrase (time series of vectors that may represent a gesture).
 * If no parameters are given, the dimensions will be guessed from the first
 * added element after instantiation of the class and after each call to clear.
 * If parameters are given, they will be used to strictly check any new element,
 * anytime.
 *
 * @param {Number} [inputDimension=null] - If defined, definitive input dimension
 * that will be checked to validate any new element added.
 * @param {Number} [outputDimension=null] - If defined, definitive output dimension
 * that will be checked to validate any new element added.
 */
class Phrase {
  constructor(inputDimension = null, outputDimension = null) {
    if (inputDimension !== null) {
      this.fixedDimensions = true;
      this.inputDimension = inputDimension;
      this.outputDimension = outpuDimension !== null ? outputDimension : 0;
    } else {
      this.fixedDimensions = false;
    }

    this.label = rapidmixDefaultLabel;
    this._init();
  }

  /**
   * Append an element to the current phrase.
   *
   * @param {Array.Number|Float32Array|Float64Array} inputVector - The input
   * part of the element to add.
   * @param {Array.Number|Float32Array|Float64Array} [outputVector=null] - The
   * output part of the element to add.
   *
   * @throws An error if inputVector or outputVector dimensions mismatch.
   */
  addElement(inputVector, outputVector = null) {
    this._validateInputAndUpdateDimensions(inputVector, outputVector);

    if (inputVector instanceof Float32Array ||
        inputVector instanceof Float64Array)
      inputVector = Array.from(inputVector);

    if (outputVector instanceof Float32Array ||
        outputVector instanceof Float64Array)
      outputVector = Array.from(outputVector);

    this.input.push(inputVector);

    if (this.outputDimension > 0)
      this.output.push(outputVector);
  }

  /**
   * Reinit the internal variables so that we are ready to record a new phrase.
   */
  clear() {
    this._init();
  }

  /**
   * Set the phrase's current label.
   *
   * @param {String} label - The new label to assign to the class.
   */
  setLabel(label) {
    this.label = label;
  }

  /**
   * Get the phrase in rapidmix format.
   *
   * @returns {Object} A rapidmix compliant phrase object.
   */
  getPhrase() {
    return {
      docType: 'rapid-mix:phrase',
      docVersion: rapidmixDocVersion,
      payload: {
        label: this.label,
        // inputDimension: this.inputDimension,
        // outputDimension: this.outputDimension,
        input: this.input.slice(0),
        output: this.output.slice(0),
      }
    };
  }

  /** @private */
  _init() {
    if (!fixedDimensions) {
      this.inputDimension = null;
      this.outputDimension = null;
    }

    this.input = [];
    this.output = [];
  }

  /** @private */
  _validateInputAndUpdateDimensions(inputVector, outputVector) {
    if (!isArray(inputVector) || (outputVector && !isArray(outputVector))) {
      throw new Error('inputVector and outputVector must be arrays');
    }

    if (!this.inputDimension || !this.outputDimension) {
      this.inputDimension = inputVector.length;
      this.outputDimension = outputVector ? outputVector.length : 0;
      // this._empty = false;
    } else if (inputVector.length != this.inputDimension ||
              outputVector.length != this.outputDimension) {
      throw new Error('dimensions mismatch');
    }
  }
}

//============================== TRAINING DATA ===============================//

/**
 * Manage and format a set of recorded examples, maintain a rapidmix compliant
 * training set.
 *
 * @param {Number} [inputDimension=null] - Input dimension
 *  (if `null`, is guessed from the first recorded element)
 * @param {Number} [outputDimension=null] - Output dimension.
 *  (if `null`, is guessed from the first recorded element).
 *
 * @example
 * import { ProcessedSensors, TrainingData } from 'iml-motion';
 *
 * const processedSensors = new ProcessedSensors();
 * const trainingData = new TrainingData(8);
 *
 * processedSensors.addListener(trainingData.addElement);
 * processedSensors.init()
 *   .then(() => processedSensors.start());
 */
class TrainingData {
  constructor(inputDimension = null, outputDimension = null, columnNames = []) {
    if (inputDimension !== null) {
      this.fixedDimensions = true;
      this.inputDimension = inputDimension;
      this.outputDimension = outpuDimension !== null ? outputDimension : 0;
    } else {
      this.fixedDimensions = false;
    }

    this.columnNames = columnNames;
    this._init();
  }

  /**
   * Add an element to the training set.
   * Valid argument combinations are :
   * - (inputVector)
   * - (inputVector, outputVector)
   * - (label, inputVector)
   * - (label, inputVector, outputVector).
   *
   * @param {String} [label=rapidmixDefaultLabel] - The label of the new element.
   * @param {Array.Number|Float32Array|Float64Array} inputVector - The input part of the new element.
   * @param {Array.Number|Float32Array|Float64Array} [outputVector=null] - The output part of the new element.
   */
  addElement(...args) {
    args = args.length > 3 ? args.slice(0, 3) : args;

    let label = rapidmixDefaultLabel;
    let inputVector = null;
    let outputVector = null;

    switch (args.length) {
      case 0:
        throw new Error('addElement needs at least an array as argument');
        break;
      case 1:
        if (isArray(args[0]))
          inputVector = args[0];
        else
          throw new Error('single argument must be an array');
        break;
      case 2:
        if (typeof args[0] === 'string' && isArray(args[1])) {
          label = args[0];
          inputVector = args[1];
        } else if (isArray(args[0]) && isArray(args[1])) {
          inputVector = args[0];
          outputVector = args[1];
        } else {
          throw new Error('two arguments can only be either label and inputVector, or inputVector and outputVector');
        }
        break;
      case 3:
        if (typeof args[0] === 'string' && isArray(args[1]) && isArray(args[2])) {
          label = args[0];
          inputVector = args[1];
          outputVector = args[2];
        } else {
          throw new Error('three arguments must be label, inputVector and outputVector');
        }
        break;
    }

    const p = new Phrase();
    p.setLabel(label);
    p.addElement(inputVector, outputVector);
    this.addPhrase(p.getPhrase());
  }

  /**
   * Add a phrase to the training set.
   *
   * @param {Object} phrase - A rapidmix formatted phrase.
   */
  addPhrase(phrase) {
    const p = phrase.payload;
    this._checkDimensions(p.input[0], p.output[0]);

    this.data.push({
      label: p.label,
      input: p.input,
      output: p.output,
    });
  }

  addTrainingSet(trainingSet) {
    const phrases = trainingSet.payload.data;
    let p = phrases[0];
    this._checkDimensions(p.input[0], p.output[0]);

    for (let i = 0; i < phrases.length; i++) {
      p = phrases[i];

      this.data.push({
        label: p.label,
        input: p.input,
        output: p.output,
      });
    }
  }

  /**
   * Sets internal data from another training set.
   *
   * @param {Object} trainingSet - A rapidMix compliant training set.
   */
  setTrainingSet(trainingSet) {
    const set = trainingSet.payload;

    this.inputDimension = set.inputDimension;
    this.outputDimension = set.outputDimension;
    this.data = set.data;
    this.columnNames = set.columnNames;
  }

  /**
   * Return the rapidMix compliant training set in JSON format.
   *
   * @return {Object} - Training set.
   */
  getTrainingSet(fragmented = false) {
    // const fragments = [];

    // for (let i = 0; i < this.data.length; i++) {
    //   if (fragmented) {
    //     fragments.push(this.data[i]);
    //   }
    // }

    return {
      docType: 'rapid-mix:training-set',
      docVersion: rapidMixDocVersion,
      payload: {
        inputDimension: this.inputDimension,
        outputDimension: this.outputDimension,
        data: this.data,
      }
    };
  }

  /**
   * Return an array of the current training set labels.
   *
   * @return {Array.String} - Training set sorted labels.
   */
  getLabels() {
    const labels = [];

    for (let i = 0; i < this.data.length; i++) {
      const label = this.data[i].label;

      if (labels.indexOf(label) === -1)
        labels.push(label);
    }

    return labels.sort();
  }

  /**
   * Clear the whole training set.
   */
  clear() {
    this._init();
  }

  /** @private */
  _init() {
    if (!fixedDimensions) {
      this.inputDimension = null;
      this.outputDimension = null;
    }

    this.data = [];
  }

  /***
   * Remove all recordings of a certain label.
   *
   * @param {String} label - The label of the recordings to be removed.
   */
  // deleteRecordingsByLabel(label) {
  //   for (let i = this.examples.length - 1; i >= 0; i--) {
  //     if (this.examples[i].label === label) {
  //       this.examples.splice(i, 1);
  //     }
  //   }
  // }

  /**
   * Remove all phrases of a certain label.
   *
   * @param {String} label - The label of the recordings to be removed.
   */
  removeElementsByLabel(label) {
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i].label === label) {
        this.data.splice(i, 1);
      }
    }
  }

  /***
   * Remove recordings by index.
   *
   * @param {Number} index - The index of the recording to be removed.
   */
  // deleteRecording(index) {
  //   if (index < this.examples.length && index > 0) {
  //     this.examples.splice(index, 1);
  //   }
  // }

  /**
   * Get the number of recordings.
   */
  get length() {
    return this.data.length;
  }

  /** @private */
  _checkDimensions(inputVector, outputVector) {
    if (!isArray(inputVector) || (outputVector && !isArray(outputVector))) {
      throw new Error('inputFrame and outputFrame must be arrays');
    }
    // set this back to true where appropriate if we add removePhrase etc methods
    if (!this.inputDimension || !this.outputDimension) {
      this.inputDimension = inputVector.length;
      this.outputDimension = outputVector ? outputVector.length : 0;
      // this._empty = false;
    } else if (inputVector.length != this.inputDimension ||
              outputVector.length != this.outputDimension) {
      throw new Error('dimensions mismatch');
    }
  }
}

export { Phrase, TrainingData };
