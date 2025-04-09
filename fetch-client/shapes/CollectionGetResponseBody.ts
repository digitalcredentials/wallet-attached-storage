/** @file shape of CollectionGetResponseBody */

import { z } from "zod"

const shapeOfCollectionGetFromJson = z.object({
  type: z.literal('Collection'),
  totalItems: z.number(),
  items: z.array(z.object({
    name: z.string(),
    url: z.string(),
  }))
})

export default shapeOfCollectionGetFromJson
