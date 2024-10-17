export const SchemaRelationshipKeys = {
    'address': [
        {
            'resourceKey': 'campaign',
            'includeKey': 'campaigns',
            'isArray': true,
            'isRelated': false
        },
        {
            'resourceKey': 'user',
            'includeKey': 'user',
            'isArray': false,
            'isRelated': false
        }
    ],
    'benefit': [
        {
            'resourceKey': 'campaign',
            'includeKey': 'campaign',
            'isArray': true,
            'isRelated': false
        },
        {
            'resourceKey': 'deliverable',
            'includeKey': 'deliverable',
            'isArray': true,
            'isRelated': false
        },
        {
            'resourceKey': 'tier',
            'includeKey': 'tier',
            'isArray': true,
            'isRelated': false
        }
    ],
    'campaign': [
        {
            'resourceKey': 'benefit',
            'includeKey': 'benefits',
            'isArray': true,
            'isRelated': false
        },
        {
            'resourceKey': 'user',
            'includeKey': 'creator',
            'isArray': false,
            'isRelated': false
        },
        {
            'resourceKey': 'goal',
            'includeKey': 'goals',
            'isArray': true,
            'isRelated': false
        },
        {
            'resourceKey': 'tier',
            'includeKey': 'tiers',
            'isArray': true,
            'isRelated': false
        }
    ],
    'client': [
        {
            'resourceKey': 'campaign',
            'includeKey': 'campaign',
            'isArray': false,
            'isRelated': false
        },
        {
            'resourceKey': 'user',
            'includeKey': 'user',
            'isArray': false,
            'isRelated': false
        }
    ],
    'deliverable': [
        {
            'resourceKey': 'benefit',
            'includeKey': 'benefit',
            'isArray': false,
            'isRelated': false
        },
        {
            'resourceKey': 'campaign',
            'includeKey': 'campaign',
            'isArray': false,
            'isRelated': false
        },
        {
            'resourceKey': 'member',
            'includeKey': 'member',
            'isArray': false,
            'isRelated': false
        },
        {
            'resourceKey': 'user',
            'includeKey': 'user',
            'isArray': false,
            'isRelated': false
        }
    ],
    'goal': [
        {
            'resourceKey': 'campaign',
            'includeKey': 'campaign',
            'isArray': false,
            'isRelated': false
        }
    ],
    'media': [],
    'member': [
        {
            'resourceKey': 'address',
            'includeKey': 'address',
            'isArray': false,
            'isRelated': false
        },
        {
            'resourceKey': 'campaign',
            'includeKey': 'campaign',
            'isArray': false,
            'isRelated': false
        },
        {
            'resourceKey': 'tier',
            'includeKey': 'currently_entitled_tiers',
            'isArray': true,
            'isRelated': false
        },
        {
            'resourceKey': 'pledge-event',
            'includeKey': 'pledge_history',
            'isArray': true,
            'isRelated': false
        },
        {
            'resourceKey': 'user',
            'includeKey': 'user',
            'isArray': false,
            'isRelated': false
        }
    ],
    'pledge-event': [
        {
            'resourceKey': 'campaign',
            'includeKey': 'campaign',
            'isArray': false,
            'isRelated': false
        },
        {
            'resourceKey': 'user',
            'includeKey': 'patron',
            'isArray': false,
            'isRelated': false
        },
        {
            'resourceKey': 'tier',
            'includeKey': 'tier',
            'isArray': false,
            'isRelated': false
        }
    ],
    'post': [
        {
            'resourceKey': 'user',
            'includeKey': 'user',
            'isArray': false,
            'isRelated': false
        },
        {
            'resourceKey': 'campaign',
            'includeKey': 'campaign',
            'isArray': false,
            'isRelated': false
        }
    ],
    'tier': [
        {
            'resourceKey': 'benefit',
            'includeKey': 'benefits',
            'isArray': true,
            'isRelated': false
        },
        {
            'resourceKey': 'campaign',
            'includeKey': 'campaign',
            'isArray': false,
            'isRelated': false
        },
        {
            'resourceKey': 'media',
            'includeKey': 'tier_image',
            'isArray': false,
            'isRelated': false
        }
    ],
    'user': [
        {
            'resourceKey': 'campaign',
            'includeKey': 'campaign',
            'isArray': false,
            'isRelated': false
        },
        {
            'resourceKey': 'member',
            'includeKey': 'memberships',
            'isArray': true,
            'isRelated': false
        }
    ],
    'webhook': [
        {
            'resourceKey': 'campaign',
            'includeKey': 'campaign',
            'isArray': false,
            'isRelated': false
        },
        {
            'resourceKey': 'client',
            'includeKey': 'client',
            'isArray': false,
            'isRelated': false
        }
    ]
}
