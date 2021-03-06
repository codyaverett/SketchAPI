import { WrappedObject, DefinedPropertiesKey } from '../WrappedObject'
import { Page } from './Page'
import { Selection } from '../Selection'
import { toArray, getURLFromPath, getDocumentData } from '../utils'
import { wrapObject } from '../wrapNativeObject'
import { Types } from '../enums'
import { Factory } from '../Factory'

/**
 * A Sketch document.
 */
export class Document extends WrappedObject {
  /**
   * Make a new document object.
   *
   * @param [Object] properties - The properties to set on the object as a JSON object.
   *                              If `sketchObject` is provided, will wrap it.
   *                              Otherwise, creates a new native object.
   */
  constructor(document = {}) {
    if (!document.sketchObject) {
      const app = NSDocumentController.sharedDocumentController()

      const error = MOPointer.alloc().init()

      // eslint-disable-next-line no-param-reassign
      document.sketchObject = app.openUntitledDocumentAndDisplay_error(
        true,
        error
      )

      if (error.value() !== null) {
        throw new Error(error.value())
      }

      if (!document.sketchObject) {
        throw new Error('could not create a new Document')
      }
    }

    super(document)
  }

  static getDocuments() {
    const app = NSDocumentController.sharedDocumentController()
    return toArray(app.documents()).map(doc => Document.fromNative(doc))
  }

  static getSelectedDocument() {
    const app = NSDocumentController.sharedDocumentController()
    const nativeDocument = app.currentDocument()
    if (!nativeDocument) {
      return undefined
    }
    return Document.fromNative(nativeDocument)
  }

  /**
   * Find the first layer in this document which has the given id.
   *
   * @return {Layer} A layer object, if one was found.
   */
  getLayerWithID(layerId) {
    const documentData = getDocumentData(this._object)
    const layer = documentData.layerWithID(layerId)
    if (layer) {
      return wrapObject(layer)
    }
    return undefined
  }

  /**
   * Find all the layers in this document which has the given name.
   */
  getLayersNamed(layerName) {
    // search all pages
    let filteredArray = NSArray.array()
    const loopPages = this._object.pages().objectEnumerator()
    let page = loopPages.nextObject()
    const predicate = NSPredicate.predicateWithFormat('name == %@', layerName)
    while (page) {
      const scope = page.children()
      filteredArray = filteredArray.arrayByAddingObjectsFromArray(
        scope.filteredArrayUsingPredicate(predicate)
      )
      page = loopPages.nextObject()
    }
    return toArray(filteredArray).map(wrapObject)
  }

  /**
   * Find the first symbol master in this document which has the given id.
   *
   * @return {SymbolMaster} A symbol master object, if one was found.
   */
  getSymbolMasterWithID(symbolId) {
    const documentData = getDocumentData(this._object)
    const symbol = documentData.symbolWithID(symbolId)
    if (symbol) {
      return wrapObject(symbol)
    }
    return undefined
  }

  getSymbols() {
    const documentData = getDocumentData(this._object)
    return toArray(documentData.allSymbols()).map(wrapObject)
  }

  /**
   * Center the view of the document window on a given layer.
   *
   * @param {Layer} layer The layer to center on.
   */
  centerOnLayer(layer) {
    const wrappedLayer = wrapObject(layer)
    this._object.contentDrawView().centerRect_(wrappedLayer.sketchObject.rect())
  }

  static open(path) {
    const app = NSDocumentController.sharedDocumentController()

    let document

    if (!path) {
      app.openDocument()

      document = app.currentDocument()
    } else {
      const url = getURLFromPath(path)

      if (app.documentForURL(url)) {
        return Document.fromNative(app.documentForURL(url))
      }

      const error = MOPointer.alloc().init()

      document = app.openDocumentWithContentsOfURL_display_error(
        url,
        true,
        error
      )

      if (error.value() !== null) {
        throw new Error(error.value())
      }
    }

    return Document.fromNative(document)
  }

  save(path) {
    let msdocument = this._object
    const saveMethod =
      'writeToURL_ofType_forSaveOperation_originalContentsURL_error'
    if (!msdocument[saveMethod]) {
      // we only have an MSDocumentData instead of a MSDocument
      // let's try to get back to the MSDocument
      msdocument = this._object.delegate()
    }

    if (!msdocument || !msdocument[saveMethod]) {
      throw new Error('Cannot save this document')
    }

    const error = MOPointer.alloc().init()

    if (!path) {
      msdocument.saveDocument(null)
    } else {
      const url = getURLFromPath(path)
      const oldUrl = NSURL.URLWithString('not used')

      msdocument[saveMethod](url, 0, NSSaveToOperation, oldUrl, error)

      if (error.value() !== null) {
        throw new Error(error.value())
      }
    }

    return this
  }

  close() {
    let msdocument = this._object

    if (!msdocument.close) {
      // we only have an MSDocumentData instead of a MSDocument
      // let's try to get back to the MSDocument
      msdocument = this._object.delegate()
    }

    if (!msdocument || !msdocument.close) {
      throw new Error('Cannot close this document')
    }

    msdocument.close()
  }
}

Document.type = Types.Document
Document[DefinedPropertiesKey] = {
  ...WrappedObject[DefinedPropertiesKey],
}
Factory.registerClass(Document, MSDocumentData)

// also register MSDocument if it exists
if (typeof MSDocument !== 'undefined') {
  Factory.registerClass(Document, MSDocument)
}

// override getting the id to make sure it's fine if we have an MSDocument
Document.define('id', {
  exportable: true,
  importable: false,
  get() {
    if (!this._object) {
      return undefined
    }
    if (!this._object.objectID) {
      return String(this._object.documentData().objectID())
    }
    return String(this._object.objectID())
  },
})

Document.define('pages', {
  get() {
    if (!this._object) {
      return []
    }
    const pages = toArray(this._object.pages())
    return pages.map(page => Page.fromNative(page))
  },
  set(pages) {
    // remove the existing pages
    this._object.removePages_detachInstances(this._object.pages(), true)

    toArray(pages)
      .map(wrapObject)
      .forEach(page => {
        page.parent = this // eslint-disable-line
      })
  },
})

/**
 * The layers that the user has selected in the currently selected page.
 *
 * @return {Selection} A selection object representing the layers that the user has selected in the currently selected page.
 */
Document.define('selectedLayers', {
  enumerable: false,
  exportable: false,
  importable: false,
  get() {
    return new Selection(this.selectedPage)
  },
})

/**
 * The current page that the user has selected.
 *
 * @return {Page} A page object representing the page that the user is currently viewing.
 */
Document.define('selectedPage', {
  enumerable: false,
  exportable: false,
  importable: false,
  get() {
    return Page.fromNative(this._object.currentPage())
  },
})
