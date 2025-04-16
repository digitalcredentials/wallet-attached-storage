/** @file types for @wallet.storage/fetch-client package */

/**
 * a urn:uuid URI
 * @see https://datatracker.ietf.org/doc/html/rfc4122
 */
export type UrnUuid = `urn:uuid:${string}`

/**
 * client to remote Storage (e.g. a Storage Server)
 *
 * It hosts a lot of data spaces.
 * This object can build clients
 * to interact with a Space of data.
 */
export interface IStorageClient {
  /**
   * create a space (client) object.
   * @param options - if a string, the string must be options.id
   * @param options.id - id of space to create
   */
  space: (options?: UrnUuid | ({ id?: UrnUuid } & ISignedRequestOptions)) => ISpace
}

export interface IResponse {
  /** MUST use HTTP Semantics */
  status?: number
  ok: boolean
  /**
   * other named data included in the response
   */
  headers: Iterable<[name:string, value:string]>
  /**
   * get a representation of the resource as a Blob.
   */
  blob?: () => Promise<Blob>
  /**
   * if this.blob is JSON, return the result of parsing it.
   */
  json?: () => Promise<unknown>
}

/**
 * options for building a signed request.
 */
export interface ISignedRequestOptions {
  signer?: ISigner
}

export type ErrorResponse =
| INotFoundResponse
| IUnauthorizedResponse

export interface Getable {
  get: (options?: ISignedRequestOptions) => Promise<IResponse | ErrorResponse>
}

interface Putable {
  put: (blob?: Blob, options?: ISignedRequestOptions) => Promise<IResponse | ErrorResponse>
}

interface Deletable {
  delete: (options?: ISignedRequestOptions) => Promise<IResponse | ErrorResponse>
}

interface Postable {
  post: (blob?: Blob, options?: ISignedRequestOptions) => Promise<IResponse | ErrorResponse>
}

/**
 * a space is the highest level of data organization
 * and partitioning.
 * each space has a namespace of named data.
 */
export interface ISpace extends Getable, Putable, Deletable {
  id: UrnUuid
  resource: (path?: string, options?: {
    signer?: ISigner
    uuid?: UrnUuid
  }) => IResourceInSpace
}

/**
 * a resource within a space at a specific path.
 */
export interface IResourceInSpace extends Getable, Putable, Deletable, Postable {
  /**
   * path that names the location within the space
   * at which this resource is found.
   */
  path: `/space/${string}/resource/${string}`
}

/**
 * response to operation on a resource
 * indicating that the resource could not be found
 * at the name sent in the request.
 */
export interface INotFoundResponse extends IResponse {
  status: 404
  ok: false
}

/**
 * response to operation on a resource
 * indicating that the resource could not be found
 * at the name sent in the request.
 */
export interface IUnauthorizedResponse extends IResponse {
  status: 401
  ok: false
}

/**
 * Digital Signature Algorithm implementation.
 */
export interface ISigner {
  /**
   * id of verification method for verifying signatures by this signer.
   * e.g. a public key or other key id
   */
  id: string
  /**
   * sign some data to produce a signature.
   * Should be compatible with signer objects from https://github.com/digitalbazaar/zcap and related libraries.
   * @param signable - what to sign
   * @param signable.data - binary data to be signed
   */
  sign: (signable: { data: Uint8Array }) => Promise<Uint8Array>
}
