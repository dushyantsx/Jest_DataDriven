module.exports = {
  mainBody: function (
    customerAccountECID,
    customerCategory,
    distributionChannel,
    externalLocationId,
    cartItems,
    charItems
  ) {
    const body = {
      relatedParty: [
        {
          id: customerAccountECID != null ? customerAccountECID : "",
          role: "customer",
          characteristic: [
            {
              name: "category",
              value: customerCategory,
            },
          ],
        },
      ],
      channel: {
        id: distributionChannel,
        name: "CSR",
      },
      place: {
        id: `${externalLocationId}`,
      },
      characteristic: charItems != null ? charItems : "",
      cartItem: cartItems != null ? cartItems : "",
    };
    return body;
  },

  addTopOfferItem: function (offer) {
    const offerItem = {
      action: "Add",
      productOffering: {
        id: offer,
      },
    };
    return offerItem;
  },

  removeTopOfferItem: function (itemId) {
    const offerItem = {
      action: "Delete",
      id: itemId,
    };
    return offerItem;
  },

  addchildOfferItem: function (childOffer, parentItem) {
    const cartItem = {
      action: "Add",
      productOffering: {
        id: childOffer,
      },
      cartItemRelationship: [
        {
          id: parentItem,
          type: "parent",
        },
      ],
    };
    return cartItem;
  },

  removechildOfferItem: function (itemId, parentItem) {
    const cartItem = {
      action: "Delete",
      id: itemId,
      cartItemRelationship: [
        {
          id: parentItem,
          type: "parent",
        },
      ],
    };
    return cartItem;
  },

  updateTopOfferItem: function (itemId, charItems) {
    const cartItem = {
      action: "Add",
      id: itemId,
      product: {
        characteristic: charItems,
      },
    };

    return cartItem;
  },

  updateChildOfferItem: function (childItemId, parentItemId, charItems) {
    const cartItem = {
      action: "Add",
      id: childItemId,
      product: {
        characteristic: charItems,
      },
      cartItemRelationship: [
        {
          id: parentItemId,
          type: "parent",
        },
      ],
    };
    return cartItem;
  },

  charItem: function (charContainter) {
    const charItem = {
      name: charContainter.name,
      value: charContainter.value,
    };
    return charItem;
  },

  validateOrSubmitBody: function (customerCategory, distributionChannel) {
    const body = {
      relatedParty: [
        {
          role: "customer",
          characteristic: [
            {
              name: "category",
              value: customerCategory,
            },
          ],
        },
      ],
      channel: {
        id: distributionChannel,
        name: "CSR",
      },
    };
    return body;
  },

  createCustomerBody: function (
    customerName,
    externalLocationId,
    customerEmail
  ) {
    const body = {
      name: customerName,
      externalLocationId: externalLocationId,
      email: customerEmail,
      phoneNumber: "7781234567",
    };
    return body;
  },

  getAvailableProductOfferings: function (context, category) {
    const body = {
      relatedParty: [
        {
          role: "customer",
          characteristic: [
            {
              name: "category",
              value: context.customerCategory,
            },
          ],
        },
      ],
      channel: {
        id: context.distributionChannel,
        name: "CSR",
      },
      place: {
        id: context.locationId,
        role: "service address",
      },
      productOfferingQualificationItem: [
        {
          id: "!",
          productOffering: {
            category: [
              {
                id: category,
              },
            ],
          },
        },
      ],
    };
    return body;
  },
};
