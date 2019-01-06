Vizsla is a simple JavaScript API for [Vega-Lite](https://vega.github.io/vega-lite/):

```js
//scatter plot
vz(cars)
  .x('Horsepower')
  .y('Miles_per_Gallon')
  .plot()
```

See this [Observable notebook](https://beta.observablehq.com/@gjmcn/vizsla-and-vega-lite) for some interactive examples.

## Install/Load

Vizsla uses the Universal Module Definition (UMD) so should work in any JavaScript environment. For example:

* Node.js:
	* install: `npm install --save @gjmcn/vizsla`
	* load: `const vz = require('@gjmcn/vizsla');`

* Browser, using `<script>`: creates a global variable `vz`

## API Reference

### Constructors

* Except for `vz.Vizsla`, do not use `new` when calling constructors.

* Constructors can be called with no arguments. For example, `vz.repeat()` creates a repeat spec with no inner spec; use [inner](#method_inner) to set the inner spec.

---

<a name="method_vz" href="#method_vz">#</a> `vz(d, ops)`

&emsp;&emsp;`d`: string (URL of data) or object/array (data)

&emsp;&emsp;`ops`: options object

Creates a unit spec and, if `d` is truthy, sets its data &mdash; see [data](#method_data).

Unit specs have mark type `'point'` by default.

Returns a new unit spec.

---

<a name="method_layer" href="#method_layer">#</a> `vz.layer(sub0, sub1, sub2, ...)`

&emsp;&emsp;`sub0`, `sub1`, `sub2`, ... : specs to be layered; unit and layer specs only

Returns a new layer spec.

---

<a name="method_hconcat" href="#method_hconcat">#</a> `vz.hconcat(sub0, sub1, sub2, ...)`<br>
<a name="method_vconcat" href="#method_vconcat">#</a> `vz.vconcat(sub0, sub1, sub2, ...)`

&emsp;&emsp;`sub0`, `sub1`, `sub2`, ... : specs to be concatenated

Returns a new hconcat or vconcat spec.

---

<a name="method_facet" href="#method_facet">#</a> `vz.facet(sub)`

&emsp;&emsp;`sub`: spec to be faceted

Use `row` and `column` (see [channel](#channel_method)) to set the channels.

Use [data](#data_method) to set the data property of a facet. If a facet does not have a data property, it uses the data of the first unit in its inner spec that has a data property &mdash; all units in the inner spec that use this data ignore their own data property.

Note: nested facets are not currently supported in Vizsla.

Returns a new facet spec.

---

<a name="method_repeat" href="#method_repeat">#</a> `vz.repeat(sub)`

&emsp;&emsp;`sub`: spec to be repeated

Use [across](#method_across) and [down](#method_down) to set the repeat directions and channels.

Note: Vizsla currently only allows a unit or facet spec to be repeated.

Returns a new repeat spec.

---

<a name="method_vizsla" href="#method_vizsla">#</a> `vz.Vizsla(type = 'unit')`

&emsp;&emsp;type: string, `'unit'`, `'layer'`, `'hconcat'`, `'vconcat'`, `'facet'` or `'repeat'`

`vz.Vizsla` is a standard constructor, so e.g. `new vz.Vizsla()` returns a new unit spec.

---

### Methods

* The following 'spec' methods are actually methods of `vz.Vizsla.prototype`.

* Various methods accept an 'options object' as their final argument. This is used to specify properties which are not covered by a dedicated method or argument. For example:

  ```js
  vz(cars)
    .bar()
    .x('Cylinders', 'o')
    .y('Acceleration', 'q', {aggregate: 'mean'})  //options object
    .plot();
  ```

---

<a name="method_mark" href="#method_mark">#</a> `spec.mark(type, ops)`

&emsp;&emsp;spec type: unit

&emsp;&emsp;`type`: string, the mark type

&emsp;&emsp;`ops`: options object

Set mark: type to `type` plus any additional mark properties specified in `ops`.

There are also convenience mark methods:

`area`, `bar`, `boxplot`, `circle`, `errorband`, `errorbar`, `geoshape`, `line`, `point`, `rect`, `rule`, `square`, `text`, `tick`, `trail`

```js
//these are equivalent
vz().bar();
vz().mark('bar');

//these are equivalent
vz().bar(ops);
vz().mark('bar', ops);
```

Mark methods return the spec.

---

<a name="method_channel" href="#method_channel">#</a> `spec.channel(chn, field, type = 'q', ops)`

&emsp;&emsp;spec type: unit or, for `row` and `column` channels only, facet

&emsp;&emsp;`chn`: string, channel name

&emsp;&emsp;`field`: string, field name

&emsp;&emsp;`type`: string, `'q'`, `'quantitative'`, `'t'`, `'temporal'`, `'o'`, `'ordinal'`, `'n'` or `'nominal'`

&emsp;&emsp;`ops`: options object

Set channel `chn`: field to `field`, type to `type` plus any additional properties specified in `ops`.

There are also convenience channel methods:

`x`, `y`, `x2`, `y2`, `longitude`, `latitude`, `longitude2`, `latitude2`,
`color`, `opacity`, `fillOpacity`, `strokeOpacity`, `strokeWidth`, `size`,
`shape`, `label`, `tooltip`, `href`, `key`, `order`, `detail`, `row`, `column`

```js
//these are equivalent
vz(cars).x('Horsepower');
vz(cars).channel('x', 'Horsepower');

//these are equivalent
vz(cars).x('Horsepower', 'q', ops);
vz(cars).channel('x', 'Horsepower', 'q', ops);
```

The `label` method actually corresponds to the text channel &mdash; `text` is a mark method.

Pass a non-`null` falsy value as `field` to omit the field property from the channel object.

Pass `true` as `field` as a shortcut for the count aggregate:

```js
//these are equivalent
vz().y(true);
vz().y(false, 'q', {aggregate: 'count'});

//these are equivalent
vz().y(true, 'q', {title: 'Total'});
vz().y(false, 'q', {aggregate: 'count', title: 'Total'});
```

Channel methods return the spec.

---

<a name="method_transform" href="#method_transform">#</a> `spec.transform(t0, t1, t2, ...)`

&emsp;&emsp;spec type: any

&emsp;&emsp;`t0`, `t1`, `t2`, ... : object

Set transform.

Returns the spec.

---

<a name="method_projection" href="#method_projection">#</a> `spec.projection(type = 'mercator', ops)`

&emsp;&emsp;spec type: unit

&emsp;&emsp;type: string

&emsp;&emsp;`ops`: options object

Set projection: type to `type` plus any additional properties specified in `ops`.

Returns the spec.

---

<a name="method_across" href="#method_across">#</a> `spec.across(chn, fields = [])`<br>
<a name="method_down" href="#method_down">#</a> `spec.down(chn, fields = [])`

&emsp;&emsp;spec type: repeat

&emsp;&emsp;`chn`: string, channel name

&emsp;&emsp;`fields`: array of strings, field names

Set across/down repeat to use channel `chn` and fields `fields`.

---

<a name="method_data" href="#method_data">#</a> `spec.data(d, ops)`

&emsp;&emsp;spec type: unit, facet

&emsp;&emsp;`d`: string (URL of data) or object/array (data)

&emsp;&emsp;`ops`: options object

Set data: url/values to `d` plus any additional properties specified in `ops`.

Note: only unit and facet specs can have data in Vizsla.

Returns the spec.

---

<a name="method_inner" href="#method_inner">#</a> `spec.inner(sub0, sub1, sub2, ...)`

&emsp;&emsp;spec type: layer, hconcat, vconcat, facet, repeat

&emsp;&emsp; `sub0`, `sub1`, `sub2`, ... : spec object

Set inner spec(s) to `sub0`, `sub1`, `sub2`, ... 

Returns the spec.

---

The following methods set the property of the same name to the argument and return the spec.

| Name | Method of |
| ---- | --------- |
| <code>description(<i>string</i>)</code> | all |
| <code>title(<i>string</i>)</code> | all |
| <code>name(<i>string</i>)</code> | all (only used at top-level)|
| <code>$schema(<i>string</i>)</code> | all (only used at top-level) |
| <code>background(<i>string</i>)</code> | all (only used at top-level) |
| <code>padding(<i>number/object</i>)</code> | all (only used at top-level) |
| <code>autosize(<i>string/object</i>)</code> | all (only used at top-level) |
| <code>config(<i>object</i>)</code> | all (only used at top-level) |
| <code>resolve(<i>object</i>)</code> | layer, hconcat, vconcat, facet, repeat |
| <code>center(<i>boolean/object</i>)</code> | hconcat, vconcat, facet, repeat |
| <code>spacing(<i>number/object</i>)</code> | hconcat, vconcat, facet, repeat |
| <code>bounds(<i>string</i>)</code> | hconcat, vconcat, facet, repeat |
| <code>align(<i>string/object</i>)</code> | facet, repeat |
| <code>width(<i>number</i>)</code> | unit, layer |
| <code>height(<i>number</i>)</code> | unit, layer |
| <code>selection(<i>object</i>)</code> | unit |

Example: 

```js
vz()
  .width(300)
  .height(200);
```

---

<a name="method_copy" href="#method_copy">#</a> `spec.copy(recursive = true)`

Copy spec. All properties are deep copied except that:

* If `recursive` is falsy, the inner spec(s) are not included in the copy.

* Inline data is _not_ copied. Specifically, the data object is deep copied except for its `values` property &mdash; the spec and the copy refer to the same data structure.

Returns the copy.

---

<a name="method_prep" href="#method_prep">#</a> `spec.prep()`

Returns a Vega-Lite spec object ready to be rendered. The returned spec is independent of the calling spec with the possible exception that they share inline data (since Vizsla does not copy inline data).

The returned spec uses the Vega-Lite `datasets` property to avoid repeating inline data and for repeat specs, includes appropriately modified versions of the inner specs.

---

<a name="method_plot" href="#method_plot">#</a> `vz.Vizsla.prototype.plot()`

The `plot` property is initially `undefined`. It should be set to a function that renders the spec.

[Vega-Embed](https://github.com/vega/vega-embed) examples:

* use Vizsla in an HTML document where Vega-Embed is loaded in a `<script>` tag:

  ```js
  vz.Vizsla.prototype.plot = function(elm, opt) {
    return vegaEmbed(elm, this.prep(), opt);
  };
  ```

* use Vizsla in an [Observable notebook](https://beta.observablehq.com/):

  ```js
  //in one cell
  vegaEmbed = require("vega-embed@3")

  //in another cell
  vz = {
    const vz = await require('@gjmcn/vizsla');
    vz.Vizsla.prototype.plot = function(opt) {
      return vegaEmbed(this.prep(), opt);
    };
    return vz;
  }
  ```
---

### Notes

* Options arguments (`ops`) take precedence over other arguments and method names. For example, `vz().bar({type: 'line'})` will set the mark type to `'line'`, not `'bar'`.

* Pass `null` to delete a spec property:

  * channel methods: `spec.channel('x', null)` or `spec.x(null)`

  * other methods: pass `null` as the first argument; e.g. `spec.mark(null)` or `spec.inner(null)`

* Spec objects have the structure:

  ```
  object
    spec           //object, spec manipulated by vz methods
    type           //string, spec type
    use            //object (unit specs only), data
    repeatChannel  //object (repeat spec only), repeat channel(s)
  ```

## Contributions

Are welcome! Open an issue or create a pull request.

## Also See

* [Altair](https://github.com/altair-viz/altair) &mdash; Python
* [VegaLite.jl](https://github.com/fredo-dedup/VegaLite.jl) &mdash; Julia
