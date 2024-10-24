/**
 * A file uploaded to patreon.com, usually an image.
 */
export interface Media {
    /**
     * When the file was created
     * @format date-time
     */
    created_at: string

    /**
     * The URL to download this media. Valid for 24 hours.
     * @format uri
     */
    download_url: string

    /**
     * File name.
     */
    file_name: string

    /**
     * The resized image URLs for this media. Valid for 2 weeks.
     */
    image_urls: object

    /**
     * Metadata related to the file
     */
    metadata: object | null

    /**
     * Mimetype of uploaded file, eg: "application/jpeg"
     */
    mimetype: string

    /**
     * Ownership id (See also {@link Media.owner_type})
     */
    owner_id: string

    /**
     * Ownership relationship type for multi-relationship medias
     */
    owner_relationship: string

    /**
     * Type of the resource that owns the file
     */
    owner_type: string

    /**
     *
     */
    size_bytes: number

    /**
     *
     */
    state: string

    /**
     * When the upload URL expires
     * @format date-time
     */
    upload_expires_at: string

    /**
     * All the parameters that have to be added to the upload form request
     */
    upload_parameters: object

    /**
     * The URL to perform a POST request to in order to upload the media file
     * @format uri
     */
    upload_url: string
}
