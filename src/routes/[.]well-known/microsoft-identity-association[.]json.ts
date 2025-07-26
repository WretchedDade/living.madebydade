
import { createServerFileRoute } from "@tanstack/react-start/server"
import { json } from '@tanstack/react-start'

export const ServerRoute = createServerFileRoute("/.well-known/microsoft-identity-association.json").methods({
    GET: async ({ request }) => {
        return json({
            "associatedApplications": [
                {
                    "applicationId": "89fd5d93-7312-46fb-96b0-0be50ea6afff"
                }
            ]
        })
    },
})