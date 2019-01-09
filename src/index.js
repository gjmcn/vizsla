(() => {
  
  'use strict';


  //---------- copy functions ----------

  const clone = require('clone');

  const copyDataObject = (d, name) => {
    const c = {};
    for (let prop in d) {
      if (prop === 'values') {
        if (name) c.name = name;
        else c.values = d.values;  //not copied
      }
      else c[prop] = clone(d[prop]);
    }
    return c;
  };


  //---------- assert ----------

  const assert = {
    typeof(x, type) {
      if (typeof x !== type) throw Error(type + ' expected');
    },
    array(a) {
      if (!Array.isArray(a)) throw Error('array expected');
    },
    Vizsla(obj) {
      if (!(obj instanceof Vizsla)) throw Error('Vizsla object expected');
    }
  };


  //---------- constructors ----------
  
  let Vizsla, vz;
  {

    const types = new Set([
      'unit', 'layer', 'hconcat', 'vconcat', 'facet', 'repeat'
    ]);

    //constructor
    Vizsla = function(type = 'unit') {
      if (!types.has(type)) throw Error('invalid spec type');
      this.type = type;
      this.spec = { $schema: 'https://vega.github.io/schema/vega-lite/v3.json' };
      if (type === 'unit') {
        this.spec.encoding = {};
        this.spec.mark = { type: 'point' };
      }
      else if (type === 'layer') this.spec.encoding = {};
      else if (type === 'facet') this.spec.facet = {};
      else if (type === 'repeat') {
        this.spec.repeat = {};
        this.repeatChannel = {};
      }
    };

    //unit
    vz = function(d, ops) {
      const vizObj = new Vizsla('unit');
      if (d) vizObj.data(d, ops);
      return vizObj;
    };

    //composition
    for (let name of ['layer', 'hconcat', 'vconcat', 'facet', 'repeat']) {
      vz[name] = (...sub) => {
        const vizObj = new Vizsla(name);
        if (sub.length) vizObj.inner(...sub);
        return vizObj;
      };
    }

    //include constructor in vz
    vz.Vizsla = Vizsla;

  }


  //---------- methods ----------

  //data
  Vizsla.prototype.data = function(d, ops) {
    if (this.type !== 'unit' && this.type !== 'facet') {
      throw Error('unit or facet spec expected');
    }
    if (d === null) delete this.use;
    else {
      let data;
      if (typeof d === 'string') data = { url: d };
      else if (typeof d === 'object') data = { values: d };
      else throw Error('invalid data');       
      if (ops) Object.assign(data, ops);
      this.use = data;
    }
    return this;
  };

  //inner
  Vizsla.prototype.inner = function(...sub) {
    if (this.type === 'unit') throw Error('composition spec expected');
    const facetOrRepeat = (this.type === 'facet' || this.type === 'repeat');
    if (sub[0] === null) delete this.spec[facetOrRepeat ? 'spec' : this.type];
    else {
      for (let s of sub) assert.Vizsla(s);
      if (facetOrRepeat) {
        if (sub.length) {
          if (this.type === 'repeat' && 
              sub[0].type !== 'unit' && sub[0].type !== 'facet') {
            throw Error('Vizsla currently only supports repeating a unit or facet');
          } 
          this.spec.spec = sub[0];
        }
        else delete this.spec.spec;
      }
      else {  //layer, hconcat or vconcat
        if (this.type === 'layer') {
          for (let s of sub) {
            if (s.type !== 'unit' && s.type !== 'layer') {
              throw Error('inner specs of layer must be units or layers');
            } 
          }
        }
        this.spec[this.type] = sub;
      }
    }
    return this;
  };

  //mark
  {
    
    //valid marks
    const marks = new Set([
      'area', 'bar', 'boxplot', 'circle', 'errorband', 'errorbar', 'geoshape',
      'line', 'point', 'rect', 'rule', 'square', 'text', 'tick', 'trail'
    ]);
    
    //main mark method
    Vizsla.prototype.mark = function(type, ops) {
      if (this.type !== 'unit') throw Error('unit spec expected');
      if (type === null) delete this.spec.mark;
      else {
        if (!marks.has(type)) throw Error('invalid mark type');
        const obj = { type };
        if (ops) Object.assign(obj, ops);
        this.spec.mark = obj;
      }
      return this;
    }

    //convenience mark methods
    for (let m of marks) {
      Vizsla.prototype[m] = function(ops) {
        this.mark(m, ops);
        return this;
      };
    }

  }

  //channels, including across and down methods for repeat
  {

    const types = new Set([
      'nominal', 'ordinal', 'quantitative', 'temporal', 'geojson'
    ]);

    const typeLookup = {};
    for (let t of types) typeLookup[t[0]] = t;

    const expandType = t => {
      t = '' + t;
      if (t.length === 1) t = typeLookup[t];
      if (!types.has(t)) throw Error('invalid data type');
      return t;
    };

    //valid channels
    const channels = new Set([
      'x', 'y', 'x2', 'y2', 'longitude', 'latitude', 'longitude2', 'latitude2',
      'color', 'opacity', 'fillOpacity', 'strokeOpacity', 'strokeWidth', 'size',
      'shape', 'label', 'tooltip', 'href', 'key', 'order', 'detail', 'row', 'column'
    ]);

    const validSpecTypes = new Set(['unit', 'layer', 'facet']);

    //encode
    Vizsla.prototype.encode = function(chn, field, type = 'q', ops) {
      if (!validSpecTypes.has(this.type)) {
        throw Error(`${this.type} spec cannot have channels`);
      }
      if (!channels.has(chn)) throw Error('invalid channel');
      if (this.type === 'facet' && chn !== 'row' && chn !== 'column') {
        throw Error('only row and column channels can be used in a facet spec');
      }
      if (chn === 'label') chn = 'text';
      const prop = (this.type === 'facet' ? 'facet' : 'encoding');
      if (field === null) delete this.spec[prop][chn];
      else {
        const obj = {};
        if (field === true) obj.aggregate = 'count';
        else if (field) {
          assert.typeof(field, 'string');
          obj.field = field;
        }
        obj.type = expandType(type);
        if (ops) Object.assign(obj, ops);
        this.spec[prop][chn] = obj;
      }
      return this;
    };

    //convenience channel methods
    for (let c of channels) {
      Vizsla.prototype[c] = function(field, type, ops) {
        this.encode(c, field, type, ops);
        return this;
      };
    }

    //across, down
    for (let name of ['across', 'down']) {
      const prop = (name === 'across' ? 'column' : 'row');
      Vizsla.prototype[name] = function(chn, fields = []) {
        if (this.type !== 'repeat') throw Error('repeat spec expected');
        if (chn === null) {
          delete this.spec.repeat[prop];
          delete this.repeatChannel[prop];
        }
        else {
          if (!channels.has(chn)) throw Error('invalid channel');
          assert.array(fields);
          for (let f of fields) assert.typeof(f, 'string');
          this.spec.repeat[prop] = fields;
          this.repeatChannel[prop] = chn;
        }
        return this;
      };
    }

  }

  //transform
  Vizsla.prototype.transform = function(...t) {
    if (t[0] === null) delete this.spec.transform;
    else {
      for (let j of t) assert.typeof(j, 'object');
      this.spec.transform = t;
    }
    return this;
  };

  //projection
  Vizsla.prototype.projection = function(type = 'mercator', ops) {
    if (this.type !== 'unit' && this.type !== 'layer') {
      throw Error('unit or layer spec expected');
    }
    if (type === null) delete this.spec.projection;
    else {
      const obj = { type };
      if (ops) Object.assign(obj, ops);
      this.spec.projection = obj;
    }
    return this;
  };

  //simple methods
  {

    const methods = [];
    const addMethod = (name, type, valid) => {
      methods.push({
        name,
        type: new Set(type),
        valid: valid ? new Set(valid) : null
      });
    };
    addMethod('name',        ['string']);
    addMethod('description', ['string']);
    addMethod('title',       ['string']);
    addMethod('$schema',     ['string']);
    addMethod('background',  ['string']);
    addMethod('padding',     ['number', 'object']);
    addMethod('autosize',    ['string', 'object']);
    addMethod('config',      ['object']);
    addMethod('resolve',     ['object'],            ['layer', 'hconcat', 'vconcat', 'facet', 'repeat']);
    addMethod('center',      ['boolean', 'object'], ['hconcat', 'vconcat', 'facet', 'repeat']);
    addMethod('spacing',     ['number', 'object'],  ['hconcat', 'vconcat', 'facet', 'repeat']);
    addMethod('bounds',      ['string'],            ['hconcat', 'vconcat', 'facet', 'repeat']);
    addMethod('align',       ['string', 'object'],  ['facet', 'repeat']);
    addMethod('width',       ['number'],            ['unit', 'layer']);
    addMethod('height',      ['number'],            ['unit', 'layer']);
    addMethod('selection',   ['object'],            ['unit']);
        
    for (let m of methods) {
      const {name, type, valid} = m;
      Vizsla.prototype[name] = function(val) {
        if (valid && !valid.has(this.type)) {
          throw Error(`${name} cannot be used with a ${this.type} spec`);
        }
        if (val === null) delete this.spec[name];
        else {
          if (!type.has(typeof val)) throw Error('invalid type');
          this.spec[name] = val;
        }
        return this;
      };
    }

  }

  //copy
  Vizsla.prototype.copy = function(recursive = true) {
    const type = this.type;
    const obj = new Vizsla(type);
    if (this.use) obj.use = copyDataObject(this.use);
    if (this.repeatChannel) obj.repeatChannel = clone(this.repeatChannel);
    if (type === 'unit') obj.spec = clone(this.spec);
    else {
      obj.spec = {};
      if (type === 'facet' || type === 'repeat') {
        for (let prop in this.spec) {
          if (prop === 'spec') {
            if (recursive) obj.spec.spec = this.spec.spec.copy();
          }
          else obj.spec[prop] = clone(this.spec[prop]);
        }
      }
      else {  //layer, hconcat or vconcat
        for (let prop in this.spec) {
          if (prop === type) {
            if (recursive) obj.spec[type] = this.spec[type].map(child => child.copy());
          }
          else obj.spec[prop] = clone(this.spec[prop]);
        }
      }
    }
    return obj;
  };
  
  //prep
  {

    const topLevelOnly = ['name', '$schema', 'background', 'padding', 'autosize', 'config'];

    const equalDataObjects = (d1, d2) => {
      for (let k of ['url', 'values', 'name']) {
        if (d1[k] && d1[k] === d2[k]) return true;
      }
    };

    Vizsla.prototype.prep = function() {
      
      const datasetsMap = new Map();

      const finalize = (viz, track, isTopLevel) => {

        const final = viz.copy(false).spec;
        const type = viz.type;

        if (!isTopLevel) {
          for (let k of topLevelOnly) delete final[k];
        }

        //parse data set
        const processData = () => {
          if (viz.use) {
            let dataObj;
            if (viz.use.values) {  //inline data
              let dataName = datasetsMap.get(viz.use.values);
              if (!dataName) {
                dataName = 'ds_' + datasetsMap.size;
                datasetsMap.set(viz.use.values, dataName);
              }
              dataObj = copyDataObject(viz.use, dataName);
            }
            else dataObj = clone(viz.use);
            if (track.inFacet && !track.facetData) track.facetData = dataObj;
            else if (!track.inFacet || !equalDataObjects(track.facetData, dataObj)) {
              final.data = dataObj;
            }
          }
        };

        //spec types
        if (type === 'unit') {
          processData();
        }
        else if (type === 'facet') {
          if (track.inFacet) {
            throw Error('Vizsla does not currently support nested facets');
          }
          track.inFacet = true;
          processData();
          const child = viz.spec.spec;
          if (child) final.spec = finalize(child, track);
          if (track.facetData) final.data = track.facetData;
          track.inFacet = false;
          track.facetData = null;
        }
        else if (type === 'repeat') {
          const child = viz.spec.spec;
          if (child) {
            final.spec = finalize(child, track);
            const prop = (child.type === 'facet' ? 'facet' : 'encoding');
            for (let direc in final.repeat) {
              const chn = viz.repeatChannel[direc];
              if (child.type === 'facet' && chn !== 'row' && chn !== 'column') {
                throw Error('only row and column channels can be used in a facet spec');
              }
              const channelObj = final.spec[prop][chn];
              if (channelObj) channelObj.field = { repeat: direc };
              else {
                final.spec[prop][chn] = { 
                  field: { repeat: direc },
                  type: 'quantitative'  
                };
              }
            }
          }
        }
        else {  //layer, vconcat, hconcat
          if (viz.spec[type]) {
            final[type] = viz.spec[type].map(child => finalize(child, track));
          }
        }

        return final;
      };
      
      //get final spec and use datasets property if required
      const finalRoot = finalize(this, {}, true);
      if (datasetsMap.size) {
        const datasetsObj = {};
        for (let [values, name] of datasetsMap.entries()) {
          datasetsObj[name] = values;
        }
        finalRoot.datasets = datasetsObj;
      }
      return finalRoot;

    };

  }
  
  //export
  module.exports = vz;

})();