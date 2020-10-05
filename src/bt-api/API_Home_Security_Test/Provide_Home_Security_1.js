const btapi = require('../btapi')

describe('Provide-2: Provide SHS; Product: Home Security 60 Months; Techniocian Install', () => {
    let shoppingCartId = null
    let woItemId = null
    let secureItemId = null
    let customerAccountECID = null

    let externalLocationId = '2990852'

    let secureOffer = btapi.data.offers.smartHomeSecuritySecure
    let commitmentOffer = btapi.data.offers.homeSecurityCommitmentOn36MonthContract
    let lwOffer = btapi.data.offers.livingWellCompanionHome

    let workOffer = btapi.data.offers.workOffer
    let distributionChannel = btapi.data.distributionChannel.CSR
    let customerCategory = btapi.data.customerCategory.CONSUMER

    let cartVersionBeforeSubmit = null

    test('[Step1] Create new RCA via SSP', () => {
        let customerEmail = 'HS_01_' + +btapi.getRandomInt(1, 99999) + 'Jest' + btapi.getRandomInt(1, 99999) + '@email.com'
        let body = {
            'name': 'Jest Autotest',
            'externalLocationId': externalLocationId,
            'email': customerEmail,
            'phoneNumber': '7781234567'
        }
        return btapi.verifyCreateCustomerAccountTBAPI(body).then(
            success => {
                expect(success, 'Customer account should have been created successfully\n' + JSON.stringify(success, null, '\t')).not.toBe(null)
                customerAccountECID = success.externalCustomerId
            },
            error => {
                expect(true, 'Error in creating Customer Account' + JSON.stringify(error, null, '\t')).toBe(false)
            }
        )
    }, btapi.timeout + 100000)

    test('[Step 2] Create assigned SC with SHS+Commitment+LW via CSR for RCA', () => {

        let body = {
            'relatedParty': [
                {
                    'id': customerAccountECID,
                    'role': 'customer',
                    'characteristic': [
                        {
                            'name': 'category',
                            'value': customerCategory
                        }
                    ]
                }
            ],
            'channel': {
                'id': distributionChannel,
                'name': 'CSR'
            },
            'place': {
                'id': externalLocationId
            },
            'cartItem': [
                {
                    'action': 'Add',
                    'productOffering': {
                        'id': secureOffer
                    }
                },
                {
                    'action': 'Add',
                    'productOffering': {
                        'id': commitmentOffer
                    }
                },
                {
                    'action': 'Add',
                    'productOffering': {
                        'id': lwOffer
                    }
                }
            ]
        }

        return btapi.$requestShoppingCart(btapi.TYPES.createShoppingCart(), body).toPromise().then(
            success => {
                expect(success, 'Response should not be empty\n').not.toBeNull()
                expect(success.response, 'Response field should be present\n' + JSON.stringify(success, null, '\t')).toBeDefined()
                expect(success.response, 'Response field should be present\n' + JSON.stringify(success, null, '\t')).not.toBeNull()
                expect(success.response.body, 'Response should contain body\n' + JSON.stringify(success, null, '\t')).toBeDefined()
                expect(success.response.body, 'Response should contain body\n' + JSON.stringify(success, null, '\t')).not.toBeNull()
                const body = success.response.body
                const responseText = JSON.stringify(success, null, '\t')
                expect(success.response.statusCode, 'statusCode should be 201' + JSON.stringify(success, null, '\t')).toBe(201)
                expect(body.status, 'SC should have OPEN status\n' + responseText).toBe('OPEN')
                expect(body.cartItem, 'Response should contain cartItem\n' + responseText).toBeDefined()
                expect(body.cartItem, 'cartItem should not be null\n' + responseText).not.toBeNull()
                let scText = JSON.stringify(body.cartItem.map(elem => {
                    return {
                        id: elem.productOffering.id + '   ' + elem.productOffering.displayName
                    }
                }), null, '\t')
                expect(body.cartItem.length, 'Expecting some offers to be returned \n' + scText).toBeGreaterThan(0)
                let secureItem = btapi.getByParent('id', secureOffer, body.cartItem)
                expect(secureItem, 'Security offer (' + secureOffer + ') should be present in response\n' + scText).not.toBeNull()
                let commitmentItem = btapi.getByParent('id', commitmentOffer, body.cartItem)
                expect(commitmentItem, 'Commitment offer (' + commitmentOffer + ') should be present in response\n' + scText).not.toBeNull()
                let livingWellItem = btapi.getByParent('id', lwOffer, body.cartItem)
                expect(livingWellItem, 'Living Well offer (' + lwOffer + ') should be present in response\n' + scText).not.toBeNull()
                body.cartItem.forEach(function (cartItem) {
                    if (cartItem.productOffering.id == secureItem) {
                        secureItemId = cartItem.id
                    } else if (cartItem.productOffering.id == workOffer) {
                        woItemId = cartItem.id
                    }
                })
                shoppingCartId = body.id
            },
            error => {
                expect(true, 'Error response is received\n' + JSON.stringify(error, null, '\t')).toBe(false)
            }
        )
    }, btapi.timeout)

    test('[Step 3] Add Purchase Flood Sensor Equipment for Home Secuirty', () => {
        expect(shoppingCartId, 'SC id should not be null, please look at the previous test\n').not.toBeNull()
        expect(secureItemId, 'secureItemId should not be null, please look at the previous test\n').not.toBeNull()
        let body = {
            'relatedParty': [
                {
                    'role': 'customer',
                    'characteristic': [
                        {
                            'name': 'category',
                            'value': customerCategory
                        }
                    ]
                }
            ],
            'cartItem': [
                {
                    'action': 'Add',
                    'productOffering': {
                        'id': btapi.data.homeSecurityEquipments.floodSensorPurchase
                    },
                    'cartItemRelationship': [{
                        'id': tvItemId,
                        'type': 'parent'
                    }]
                },
                {
                    'action': 'Add',
                    'productOffering': {
                        'id': btapi.data.homeSecurityEquipments.glassBreakSensonPurchase
                    },
                    'cartItemRelationship': [{
                        'id': secureItemId,
                        'type': 'parent'
                    }]
                }
            ],
            'channel': {
                'id': distributionChannel,
                'name': 'CSR'
            },
            'place': {
                'id': externalLocationId
            }
        }

        return btapi.$requestShoppingCart(btapi.TYPES.updateShoppingCart(shoppingCartId), body).toPromise().then(
            success => {
                expect(success.response, 'Response field should be present\n' + JSON.stringify(success, null, '\t')).toBeDefined()
                expect(success.response, 'Response field should be present\n' + JSON.stringify(success, null, '\t')).not.toBeNull()
                expect(success.response.body, 'Response field should contain body\n' + JSON.stringify(success, null, '\t')).toBeDefined()
                expect(success.response.body, 'Response field should contain body\n' + JSON.stringify(success, null, '\t')).not.toBeNull()
                const body = success.response.body
                expect(body.status, 'SC should have OPEN status\n' + JSON.stringify(success, null, '\t')).toBe('OPEN')
                expect(body.cartItem, 'Response should contain cartItem\n').toBeDefined()
                expect(body.cartItem, 'cartItem should not be null\n').not.toBeNull()
                let scText = JSON.stringify(body.cartItem.map(elem => {
                    return {
                        id: elem.productOffering.id + '   ' + elem.productOffering.displayName
                    }
                }, null, '\t'))
                expect(body.cartItem.length, 'cartItem should contain 4 items:  HS, Commetment, LW and WO\n' + scText).toBe(6)
                expect(body.validationErrors, 'Validation Errors should be defined\n').toBeDefined()
                expect(body.validationErrors, 'Validation Errors should be null\n' + JSON.stringify(body.validationErrors, null, '\t')).not.toBeNull()
                let secureItem = btapi.getByParent('id', secureOffer, body.cartItem)
                expect(secureItemId, 'Secure offer (' + secureOffer + ') should be present in response as 2 equipments were added.\n' + scText).not.toBeNull()
                body.cartItem.forEach(function (item) {
                    let product = item['product']
                    expect(item.product.place[0].id, 'Place ID under ' + product.displayName + ' top offer should be the same like Place ID in request\n').toBe(externalLocationId)
                    expect(item['action'], 'Action for offer ' + product['displayName'] + ' should be "Add"\n').toBe('Add')
                    expect(product['characteristics'].length, 'Characteristics for offer ' + product['displayName'] + ' should be present\n').not.toBe(0)
                    item.productOffering.id == secureOffer ? secureItem = item : null
                    if (item.productOffering.id == workOffer) {
                        woItemId = item.id
                    }
                })

                let expChildren = [
                    btapi.data.homeSecurityEquipments.floodSensorPurchase,
                    btapi.data.homeSecurityEquipments.glassBreakSensonPurchase
                ]
                let actChildren = []
                secureItem.cartItem.forEach(function (childItem) {
                    let childProduct = childItem['productOffering']
                    actChildren.push(childProduct['id'])
                    expect(childItem.action, 'Action for offer ' + childProduct['id'] + ' should be "Add"\n').toBe('Add')
                })
                expect(actChildren.length, '\nAmount of child Items for TV(' + tvOffer + ') should be 2:\n ' + expChildren).toBe(2)
                expChildren.forEach(element => {
                    expect(actChildren.includes(element), `Child "${element}" for TV offer is missed in response.\n Actual children offers:\n` + actChildren).toBeTruthy()
                })
            },
            error => {
                expect(true, 'Error response is received\n' + JSON.stringify(error, null, '\t')).toBe(false)
            }
        )
    }, btapi.timeout)

    test('[Step 4] Set Previous Provide for Home Securtiy (Mandatory Parameter)', () => {
        expect.hasAssertions()
        expect(shoppingCartId, 'SC id should be received from previous test').not.toBeNull()
        let distributionChannel = btapi.data.distributionChannel.CSR
        let distributionChannelName = 'CSR'
        let customerCategory = btapi.data.customerCategory.CONSUMER
        let body = {
            'relatedParty': [{
                'role': 'customer',
                'characteristic': [{
                    'name': 'category',
                    'value': customerCategory
                }]
            }],
            'place': {
                'id': externalLocationId
            },
            'characteristic': [
                {
                    'name': '9151790559313390133',
                    'value': null
                },
                {
                    'name': '9151790559313390189',
                    'value': null
                }
            ],
            'channel': {
                'id': distributionChannel,
                'name': distributionChannelName
            },
            'cartItem': [
                {
                    'action': 'Add',
                    'id': secureItemId,
                    'product': {
                        'characteristic': [
                            {
                                'name': '9152694600113929802',
                                'value': btapi.data.homeSecurityProviders.PalandinProvider
                            }
                        ]
                    }
                }
            ]
        }

        return btapi.$requestShoppingCart(btapi.TYPES.updateShoppingCart(shoppingCartId), body).toPromise().then(
            success => {
                expect(success.response, 'Response field should be present\n' + JSON.stringify(success, null, '\t')).toBeDefined()
                expect(success.response, 'Response field should be present\n' + JSON.stringify(success, null, '\t')).not.toBeNull()
                expect(success.response.body, 'Response should contain body\n' + JSON.stringify(success, null, '\t')).toBeDefined()
                expect(success.response.body, 'Response should contain body\n' + JSON.stringify(success, null, '\t')).not.toBeNull()
                let body = success.response.body
                expect(body, 'Response should contain body\n' + JSON.stringify(success, null, '\t')).toBeDefined()
                expect(body.status, '[FIFA-1759] Shopping cart should have OPEN status\n' + JSON.stringify(body, null, '\t')).toBe('OPEN')
                expect(body.createdDateTime, 'Response should contain createdDatetime\n').toBeDefined()
                expect(body.id, 'Response should contain cart ID\n' + JSON.stringify(body, null, '\t')).toBeDefined()
                expect(body.characteristic, 'SC should contain characteristics' + JSON.stringify(body, null, '\t')).not.toBeNull()
                expect(body.characteristic.length, 'SC should contain characteristics' + JSON.stringify(body, null, '\t')).toBeGreaterThan(0)
                expect(btapi.getBy('name', '9151790559313390133', body.characteristic), 'SC should contain characteristic "9151790559313390133"\n' + JSON.stringify(body.characteristic.map((char) => {
                    return {
                        name: char.name,
                        value: char.value
                    }
                }), null, '\t')).not.toBeNull()
                expect(btapi.getBy('name', '9151790559313390133', body.characteristic).value, 'SC should contain null value for characteristic "9151790559313390133"\n' + JSON.stringify(body.characteristic.map((char) => {
                    return {
                        name: char.name,
                        value: char.value
                    }
                }), null, '\t')).toBeNull()

                expect(btapi.getBy('name', '9151790559313390189', body.characteristic), 'SC should contain characteristic "9151790559313390189"\n' + JSON.stringify(body.characteristic.map((char) => {
                    return {
                        name: char.name,
                        value: char.value
                    }
                }), null, '\t')).not.toBeNull()
                expect(btapi.getBy('name', '9151790559313390189', body.characteristic).value, 'SC should contain null value for characteristic "9151790559313390189"\n' + JSON.stringify(body.characteristic.map((char) => {
                    return {
                        name: char.name,
                        value: char.value
                    }
                }), null, '\t')).toBeNull()
                let secureItem = btapi.getByParent('id', workOffer, body.cartItem)
                expect(secureItem, 'Offer (' + secureOffer + ') should be present in response\n' + JSON.stringify(body.cartItem.map(elem => {
                    return {
                        id: elem.productOffering.id + '   ' + elem.productOffering.displayName
                    }
                }))).not.toBeNull()
                body.cartItem.forEach((item) => {
                    item.productOffering.id == secureOffer ? secureItem = item : null
                })
                expect(secureItem.product.characteristics, 'Offer (' + secureOffer + ') should contain characteristics\n' + JSON.stringify(secureItem, null, '\t')).not.toBeNull()
                expect(secureItem.product.characteristics.length, 'Offer (' + secureOffer + ') should contain characteristics\n' + JSON.stringify(secureItem, null, '\t')).toBeGreaterThan(0)
                expect(btapi.getBy('name', '9152694600113929802', secureItem.product.characteristics), 'Offer (' + secureOffer.productOffering.id + ') should contain characteristic 9152694600113929802\n' + JSON.stringify(secureItem, null, '\t')).not.toBeNull()
            },
            error => {
                expect(true, 'Error response is received\n' + JSON.stringify(error, null, '\t')).toBe(false)
            }
        )
    }, btapi.timeout)

    test('[Step 5] Update WO + SO characteristics via CSR for RCA', () => {
        expect.hasAssertions()
        expect(shoppingCartId, 'SC id should be received from previous test').not.toBeNull()
        let distributionChannel = btapi.data.distributionChannel.CSR
        let distributionChannelName = 'CSR'
        let customerCategory = btapi.data.customerCategory.CONSUMER
        let body = {
            'relatedParty': [{
                'role': 'customer',
                'characteristic': [{
                    'name': 'category',
                    'value': customerCategory
                }]
            }],
            'place': {
                'id': externalLocationId
            },
            'characteristic': [
                {
                    'name': '9151790559313390133',
                    'value': null
                },
                {
                    'name': '9151790559313390189',
                    'value': null
                }
            ],
            'channel': {
                'id': distributionChannel,
                'name': distributionChannelName
            },
            'cartItem': [
                {
                    'action': 'Add',
                    'id': woItemId,
                    'product': {
                        'characteristic': [
                            {
                                'name': '9146582494313682120',
                                'value': 'Test Additional Information for Technician!!!'
                            },
                            {
                                'name': '9146583488613682622',
                                'value': 'Test Contact Name'
                            },
                            {
                                'name': '9146583560513682624',
                                'value': '6042202121'
                            },
                            {
                                'name': '9146584385713682940',
                                'value': '1555527600000'
                            },
                            {
                                'name': '9146584120013682838',
                                'value': '1555538400000'
                            }
                        ]
                    }
                }
            ]
        }

        return btapi.$requestShoppingCart(btapi.TYPES.updateShoppingCart(shoppingCartId), body).toPromise().then(
            success => {
                expect(success.response, 'Response field should be present\n' + JSON.stringify(success, null, '\t')).toBeDefined()
                expect(success.response, 'Response field should be present\n' + JSON.stringify(success, null, '\t')).not.toBeNull()
                expect(success.response.body, 'Response should contain body\n' + JSON.stringify(success, null, '\t')).toBeDefined()
                expect(success.response.body, 'Response should contain body\n' + JSON.stringify(success, null, '\t')).not.toBeNull()
                let body = success.response.body
                expect(body, 'Response should contain body\n' + JSON.stringify(success, null, '\t')).toBeDefined()
                expect(body.status, 'Shopping cart should have OPEN status\n' + JSON.stringify(body, null, '\t')).toBe('OPEN')
                expect(body.createdDateTime, 'Response should contain createdDatetime\n').toBeDefined()
                expect(body.id, 'Response should contain cart ID\n' + JSON.stringify(body, null, '\t')).toBeDefined()
                expect(body.characteristic, 'SC should contain characteristics' + JSON.stringify(body, null, '\t')).not.toBeNull()
                expect(body.characteristic.length, 'SC should contain characteristics' + JSON.stringify(body, null, '\t')).toBeGreaterThan(0)
                expect(btapi.getBy('name', '9151790559313390133', body.characteristic), 'SC should contain characteristic "9151790559313390133"\n' + JSON.stringify(body.characteristic.map((char) => {
                    return {
                        name: char.name,
                        value: char.value
                    }
                }), null, '\t')).not.toBeNull()
                expect(btapi.getBy('name', '9151790559313390133', body.characteristic).value, 'SC should contain null value for characteristic "9151790559313390133"\n' + JSON.stringify(body.characteristic.map((char) => {
                    return {
                        name: char.name,
                        value: char.value
                    }
                }), null, '\t')).toBeNull()

                expect(btapi.getBy('name', '9151790559313390189', body.characteristic), 'SC should contain characteristic "9151790559313390189"\n' + JSON.stringify(body.characteristic.map((char) => {
                    return {
                        name: char.name,
                        value: char.value
                    }
                }), null, '\t')).not.toBeNull()
                expect(btapi.getBy('name', '9151790559313390189', body.characteristic).value, 'SC should contain null value for characteristic "9151790559313390189"\n' + JSON.stringify(body.characteristic.map((char) => {
                    return {
                        name: char.name,
                        value: char.value
                    }
                }), null, '\t')).toBeNull()
                let workOfferItem = btapi.getByParent('id', workOffer, body.cartItem)
                expect(workOfferItem, 'Offer (' + workOfferItem + ') should be present in response\n' + JSON.stringify(body.cartItem.map(elem => {
                    return {
                        id: elem.productOffering.id + '   ' + elem.productOffering.displayName
                    }
                }))).not.toBeNull()
                body.cartItem.forEach((item) => {
                    item.productOffering.id == workOffer ? workOfferItem = item : null
                })
                expect(workOfferItem.product.characteristics, 'Offer (' + workOfferItem + ') should contain characteristics\n' + JSON.stringify(workOfferItem, null, '\t')).not.toBeNull()
                expect(workOfferItem.product.characteristics.length, 'Offer (' + workOfferItem + ') should contain characteristics\n' + JSON.stringify(workOfferItem, null, '\t')).toBeGreaterThan(0)
                expect(btapi.getBy('name', '9146582494313682120', workOfferItem.product.characteristics), 'Offer (' + workOfferItem.productOffering.idItem + ') should contain characteristic 9146582494313682120\n' + JSON.stringify(workOfferItem, null, '\t')).not.toBeNull()
                expect(btapi.getBy('name', '9146582494313682120', workOfferItem.product.characteristics).value, 'Offer (' + workOfferItem.productOffering.id + ') should contain characteristic 9146582494313682120\n' + JSON.stringify(workOfferItem, null, '\t')).not.toBeNull()

                expect(btapi.getBy('name', '9146583488613682622', workOfferItem.product.characteristics), 'Offer (' + workOfferItem.productOffering.id + ') should contain characteristic 9146583488613682622\n' + JSON.stringify(workOfferItem, null, '\t')).not.toBeNull()
                expect(btapi.getBy('name', '9146583488613682622', workOfferItem.product.characteristics).value, 'Offer (' + workOfferItem.productOffering.id + ') should contain characteristic 9146583488613682622\n' + JSON.stringify(workOfferItem, null, '\t')).not.toBeNull()

                expect(btapi.getBy('name', '9146583560513682624', workOfferItem.product.characteristics), 'Offer (' + workOfferItem.productOffering.id + ') should contain characteristic 9146583560513682624\n' + JSON.stringify(workOfferItem, null, '\t')).not.toBeNull()
                expect(btapi.getBy('name', '9146583560513682624', workOfferItem.product.characteristics).value, 'Offer (' + workOfferItem.productOffering.id + ') should contain characteristic 9146583560513682624\n' + JSON.stringify(workOfferItem, null, '\t')).not.toBeNull()

                expect(btapi.getBy('name', '9146584385713682940', workOfferItem.product.characteristics), 'Offer (' + workOfferItem.productOffering.id + ') should contain characteristic 9146584385713682940\n' + JSON.stringify(workOfferItem, null, '\t')).not.toBeNull()
                expect(btapi.getBy('name', '9146584385713682940', workOfferItem.product.characteristics).value, 'Offer (' + workOfferItem.productOffering.id + ') should contain characteristic 9146584385713682940\n' + JSON.stringify(workOfferItem, null, '\t')).not.toBeNull()

                expect(btapi.getBy('name', '9146584120013682838', workOfferItem.product.characteristics), 'Offer (' + workOfferItem.productOffering.id + ') should contain characteristic 9146584120013682838\n' + JSON.stringify(workOfferItem, null, '\t')).not.toBeNull()
                expect(btapi.getBy('name', '9146584120013682838', workOfferItem.product.characteristics).value, 'Offer (' + workOfferItem.productOffering.id + ') should contain characteristic 9146584120013682838\n' + JSON.stringify(workOfferItem, null, '\t')).not.toBeNull()
            },
            error => {
                expect(true, 'Error response is received\n' + JSON.stringify(error, null, '\t')).toBe(false)
            }
        )
    }, btapi.timeout)

    test('[Step 6] Validate SC via SSP for RCA', () => {
        expect.hasAssertions()

        expect(shoppingCartId, 'SC id should not be null, please look at the previous test\n').not.toBeNull()
        let body = {
            'relatedParty': [
                {
                    'role': 'customer',
                    'characteristic': [
                        {
                            'name': 'category',
                            'value': customerCategory
                        }
                    ]
                }
            ],
            'channel': {
                'id': distributionChannel,
                'name': 'SSP'
            }
        }

        return btapi.$requestShoppingCart(btapi.TYPES.validateShoppingCart(shoppingCartId), body).toPromise().then(
            success => {
                expect(success.response, 'Response field should be present\n' + JSON.stringify(success, null, '\t')).toBeDefined()
                expect(success.response, 'Response field should be present\n' + JSON.stringify(success, null, '\t')).not.toBeNull()
                expect(success.response.body, 'Response should contain body\n' + JSON.stringify(success, null, '\t')).toBeDefined()
                expect(success.response.body, 'Response should contain body\n' + JSON.stringify(success, null, '\t')).not.toBeNull()
                const body = success.response.body
                const responseText = JSON.stringify(success, null, '\t')
                expect(body, 'Response should contain body\n' + responseText).toBeDefined()
                expect(body.status, 'SC should have OPEN status\n' + responseText).toBe('OPEN')
                expect(body.cartItem, 'Response should contain cartItem\n' + responseText).toBeDefined()
                expect(body.cartItem.length, 'cartItem should not be empty - HS, LW and WO\n' +
                    JSON.stringify(body.cartItem.map(elem => {
                        return {
                            id: elem.productOffering.id + '   ' + elem.productOffering.displayName
                        }
                    }))
                ).toBeGreaterThan(0)

                expect(body.version, 'Cart version should be defined \n' + JSON.stringify(body, function (key, value) {
                    return key && value && typeof value !== 'number' ? (Array.isArray(value) ? '[object Array]' : '' + value) : value
                }, '\t')).toBeDefined()
                expect(parseFloat(body.version), 'Cart version should be greater than 0 as we are on \n').toBeGreaterThan(0)
                cartVersionBeforeSubmit = body.version
                console.log('Cart Id : ' + cartVersionBeforeSubmit + 'cart Version Before Submit : ' + cartVersionBeforeSubmit)
            },
            error => {
                expect(true, 'Error response is received\n' + JSON.stringify(error, null, '\t')).toBe(false)
            }
        )
    }, btapi.timeout)

    test('Submit SC via SSP for RCA', () => {
        expect.hasAssertions()
        expect(shoppingCartId, 'SC id should not be null, please look at the previous test\n').not.toBeNull()
        let body = {
            'relatedParty': [
                {
                    'role': 'customer',
                    'characteristic': [
                        {
                            'name': 'category',
                            'value': btapi.data.customerCategory.CONSUMER
                        }
                    ]
                }
            ],
            'channel': {
                'id': btapi.data.distributionChannel.SSP,
                'name': 'CSR'
            } }

        return btapi.$requestShoppingCart(btapi.TYPES.submitShoppingCart(shoppingCartId), body).toPromise().then(
            success => {
                expect(success.response, 'Response field should be present\n' + JSON.stringify(success, null, '\t')).toBeDefined()
                expect(success.response, 'Response field should be present\n' + JSON.stringify(success, null, '\t')).not.toBeNull()
                expect(success.response.body, 'Response should contain body\n' + JSON.stringify(success, null, '\t')).toBeDefined()
                expect(success.response.body, 'Response should contain body\n' + JSON.stringify(success, null, '\t')).not.toBeNull()
                const body = success.response.body
                const responseText = JSON.stringify(success, null, '\t')
                expect(body.id, 'SalesOrderId should be defined\n' + responseText).toBeDefined()
                expect(body.id, 'SalesOrderId should not be null\n' + responseText).not.toBe(null)
            },
            error => {
                expect(true, 'Error response is received\n' + JSON.stringify(error, null, '\t')).toBe(false)
            }
        )
    }, btapi.timeout)
})