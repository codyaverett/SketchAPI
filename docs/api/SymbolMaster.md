---
title: Symbol Master
order: 209
section: components
---

```javascript
var SymbolMaster = require('sketch/dom').SymbolMaster
```

A [Symbol](https://www.sketchapp.com/docs/symbols/) master. It is an instance of [Artboard](#artboard) (hence of [Layer](#layer) and [Group](#group)) so all the methods defined there are available.

| Properties                                                 |                                                                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| id<span class="arg-type">string</span>                     | The unique ID of the Symbol Master object (not to be confused with `symbolId`).                         |
| name<span class="arg-type">string</span>                   | The name of the Symbol Master                                                                           |
| parent<span class="arg-type">[Group](#group)</span>        | The group the Symbol Master is in.                                                                      |
| frame<span class="arg-type">[Rectangle](#rectangle)</span> | The frame of the Symbol Master. This is given in coordinates that are local to the parent of the layer. |
| flow<span class="arg-type">[Flow](#flow)</span>            | The prototyping action associated with the Symbol.                                                      |
| symbolId<span class="arg-type">string</span>               | The unique ID of the Symbol that the master and its instances share.                                    |

## Create a new Symbol Master

```javascript
var master = new SymbolMaster({
  name: 'my symbol master',
})
```

## Create a new Symbol Master from an Artboard

```javascript
var master = SymbolMaster.fromArtboard(artboard)
```

Replace the artboard with a symbol master.

| Parameters                                                             |                                         |
| ---------------------------------------------------------------------- | --------------------------------------- |
| artboard<span class="arg-type">[Artboard](#artboard) - required</span> | The artboard to create the master from. |

### Returns

A new SymbolMaster

## Change to an Artboard

```javascript
var artboard = master.toArtboard()
```

Replace the symbol master with an artboard and detach all its instances converting them into groups.

### Returns

A new [Artboard](#artboard)

## Create a new Instance

```javascript
var instance = master.createNewInstance()
```

Creates a new [SymbolInstance](#symbol-instance) linked to this master, ready for inserting in the document.

### Returns

A new [SymbolInstance](#symbol-instance)

## Get all the Instances

```javascript
var instances = master.getAllInstances()
```

Returns an array of all instances of the symbol in the document, on all pages.

## Get the Library it was defined in

```javascript
var originLibrary = master.getLibrary()
```

If the Symbol Master was imported from a library, the method can be used to:

* know about it
* get the library back

### Returns

The [Library](#library) the symbol was defined in, or `undefined` if it is a local symbol.

## Sync the local reference with the library version

```javascript
const success = master.syncWithLibrary()
```

If a [Library](#library) has some updates, you can synchronize the local Symbol Master with the Library's version and bypass the panel where the user chooses the updated to bring.

### Returns

`true` if it succeeded.

## Unlink the local reference from the library

```javascript
const success = master.unlinkFromLibrary()
```

You can unlink a Symbol Master from the Library it comes from and make it a local Symbol Master instead. It will be added to the `Symbols` Page.

### Returns

`true` if it succeeded.
