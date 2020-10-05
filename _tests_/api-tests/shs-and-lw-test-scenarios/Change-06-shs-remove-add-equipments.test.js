const btapi = require('../../../src/bt-api/btapi')
const bodySamples = require('../../../src/bt-api/bodySamples')
const logger = require("../../../src/logger/Logger");
const TelusApis = require("../../../src/utils/telus-apis/TelusApis");
const config = require("../../../br-config")
const DateUtils = require("../../../src/utils/common/DateUtils");
const DbUtils = require("../../../src/utils/dbutils/DbUtils");
const StringUtils = require("../../../src/utils/common/StringUtils");


const du = DbUtils.DbUtils;
const dq = DbUtils.DbQueries;

const tapis = new TelusApis();

let envcfg = config.getConfigForGivenEnv();
let apicfg = config.getTelusApisConfig(envcfg);
const dbcfg = config.getDbConfig(envcfg);

describe('Change-6: Active Control Plus Vide with 4 outdoor/indoor cameras; remove and add equipment', () => {
    let shoppingCartId = null
    let woItemId = null
    let controlPlusVideoItemId = null
    let customerAccountECID = null
    let customerId = null

    let controlPlusVideoItem = null
    let externalLocationId = '2990852'

    let controlPlusVideoOffer = btapi.data.homeSecurityOffers.controlPlusVideoOffer
    let commitmentOffer = btapi.data.offers.homeSecurityCommitmentOn36MonthContract

    let workOffer = btapi.data.offers.workOffer
    let distributionChannel = btapi.data.distributionChannel.CSR
    let customerCategory = btapi.data.customerCategory.CONSUMER

    let cartVersionBeforeSubmit = null

    let startDate = null
    let endDate = null

    test('[Step1] Create new RCA via SSP', () => {
        let customerEmail = 'HS_01_' + +btapi.getRandomInt(1, 99999) + 'Jest' + btapi.getRandomInt(1, 99999) + '@email.com'
        let body = bodySamples.createCustomerBody(externalLocationId, customerEmail)

        return btapi.verifyCreateCustomerAccountTBAPI(body).then(
            success => {
                expect(success, 'Customer account should have been created successfully\n' + JSON.stringify(success, null, '\t')).not.toBe(null)
                customerAccountECID = success.externalCustomerId;
                customerId = success.customerId;
            },
            error => {
                expect(true, 'Error in creating Customer Account' + JSON.stringify(error, null, '\t')).toBe(false)
            }
        )
    }, btapi.timeout + 100000)

    test('[Step 2] Create assigned SC with SHS+Commitment via CSR for RCA', () => {
        logger.info("CUSTOMER_ID:" + customerId)

        var offerList = [controlPlusVideoOffer, commitmentOffer];

        let body = btapi.generateShoppingCartBody.addTopOffers(customerAccountECID, customerCategory, distributionChannel, externalLocationId, offerList)

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
                controlPlusVideoItem = btapi.getByParent('id', controlPlusVideoOffer, body.cartItem)
                expect(controlPlusVideoItem, 'Security offer (' + controlPlusVideoOffer + ') should be present in response\n' + scText).not.toBeNull()
                let commitmentItem = btapi.getByParent('id', commitmentOffer, body.cartItem)
                expect(commitmentItem, 'Commitment offer (' + commitmentOffer + ') should be present in response\n' + scText).not.toBeNull()
                body.cartItem.forEach(function (cartItem) {
                    if (cartItem.productOffering == controlPlusVideoItem) {
                        controlPlusVideoItemId = cartItem.id
                    } else if (cartItem.productOffering == workOffer) {
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

    test('[Step 3] Add 4 Indoor and 3 Outdoor Camera Equipment for Home Secuirty', () => {
        expect(shoppingCartId, 'SC id should not be null, please look at the previous test\n').not.toBeNull()
        expect(controlPlusVideoItemId, 'controlPlusVideoItemId should not be null, please look at the previous test\n').not.toBeNull()

        var childOfferList = [
            btapi.data.homeSecurityEquipments.indoorCameraEasy,
            btapi.data.homeSecurityEquipments.indoorCameraEasy,
            btapi.data.homeSecurityEquipments.indoorCameraEasy,
            btapi.data.homeSecurityEquipments.indoorCameraEasy,
            btapi.data.homeSecurityEquipments.outdoorCameraEasy,
            btapi.data.homeSecurityEquipments.outdoorCameraEasy,
            btapi.data.homeSecurityEquipments.outdoorCameraEasy
        ];


        let body = btapi.generateShoppingCartBody.addChildOffers(customerAccountECID, customerCategory, distributionChannel, externalLocationId, childOfferList, controlPlusVideoItemId);

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
                controlPlusVideoItem = btapi.getByParent('id', controlPlusVideoOffer, body.cartItem)
                expect(controlPlusVideoItemId, 'controlPlusVideo offer (' + controlPlusVideoOffer + ') should be present in response as 2 equipments were added.\n' + scText).not.toBeNull()
                body.cartItem.forEach(function (item) {
                    let product = item['product']
                    expect(item.product.place[0].id, 'Place ID under ' + product.displayName + ' top offer should be the same like Place ID in request\n').toBe(externalLocationId)
                    expect(item['action'], 'Action for offer ' + product['displayName'] + ' should be "Add"\n').toBe('Add')
                    expect(product['characteristics'].length, 'Characteristics for offer ' + product['displayName'] + ' should be present\n').not.toBe(0)
                    item.productOffering.id == controlPlusVideoOffer ? controlPlusVideoItem = item : null
                    if (item.productOffering.id == workOffer) {
                        woItemId = item.id
                    }
                })

                let expChildren = [
                    btapi.data.homeSecurityEquipments.indoorCameraEasy,
                    btapi.data.homeSecurityEquipments.outdoorCameraEasy
                ]
                let actChildren = []
                controlPlusVideoItem.cartItem.forEach(function (childItem) {
                    let childProduct = childItem['productOffering']
                    actChildren.push(childProduct['id'])
                    expect(childItem.action, 'Action for offer ' + childProduct['id'] + ' should be "Add"\n').toBe('Add')
                })
                expChildren.forEach(element => {
                    expect(actChildren.includes(element), `Child "${element}" for HS offer is missed in response.\n Actual children offers:\n` + actChildren).toBeTruthy()
                })
            },
            error => {
                expect(true, 'Error response is received\n' + JSON.stringify(error, null, '\t')).toBe(false)
            }
        )
    }, btapi.timeout)

    test('[Step 4] Set Previous Provider for Home Securtiy (Mandatory Parameter)', () => {
        expect.hasAssertions()
        expect(shoppingCartId, 'SC id should be received from previous test').not.toBeNull()
        let distributionChannel = btapi.data.distributionChannel.CSR
        let distributionChannelName = 'CSR'
        let customerCategory = btapi.data.customerCategory.CONSUMER

        var charSalesList = [
            { name: '9151790559313390133', value: null },
            { name: '9151790559313390189', value: null }
        ]

        var charList = [{ name: '9152694600113929802', value: btapi.data.homeSecurityProviders.PalandinProvider }]

        let body = btapi.generateShoppingCartBody.updateCharsTopItem(customerAccountECID, customerCategory, distributionChannel, externalLocationId, charList, controlPlusVideoItemId, charSalesList)

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
                controlPlusVideoItem = btapi.getByParent('id', controlPlusVideoOffer, body.cartItem)
                expect(controlPlusVideoItem, 'Offer (' + controlPlusVideoOffer + ') should be present in response\n' + JSON.stringify(body.cartItem.map(elem => {
                    return {
                        id: elem.productOffering.id + '   ' + elem.productOffering.displayName
                    }
                }))).not.toBeNull()
                body.cartItem.forEach((item) => {
                    item.productOffering.id == controlPlusVideoOffer ? controlPlusVideoItem = item : null
                })
                expect(controlPlusVideoItem.product.characteristics, 'Offer (' + controlPlusVideoOffer + ') should contain characteristics\n' + JSON.stringify(controlPlusVideoItem, null, '\t')).not.toBeNull()
                expect(controlPlusVideoItem.product.characteristics.length, 'Offer (' + controlPlusVideoOffer + ') should contain characteristics\n' + JSON.stringify(controlPlusVideoItem, null, '\t')).toBeGreaterThan(0)
                expect(btapi.getBy('name', '9152694600113929802', controlPlusVideoItem.product.characteristics), 'Offer (' + controlPlusVideoOffer + ') should contain characteristic 9152694600113929802\n' + JSON.stringify(controlPlusVideoItem, null, '\t')).not.toBeNull()
            },
            error => {
                expect(true, 'Error response is received\n' + JSON.stringify(error, null, '\t')).toBe(false)
            }
        )
    }, btapi.timeout)

    test('[Step 5] Get Search Available Appointments', async () => {
        logger.info("External_Customer_id:" + customerAccountECID)
        logger.info("CUSTOMER_ID:" + customerId)
        let response = await tapis.processSearchAvailableAppointment(apicfg, externalLocationId);
        let appointmentList = [];
        expect(response.text, 'Response  should be present\n' + JSON.stringify(response.text, null, '\t')).toBeDefined()
        await btapi.parseXmlResponse(response.text).then(function (success) {
            expect(success.Envelope.Body, 'Response should contain body\n' + JSON.stringify(success, null, '\t')).not.toBeNull()
            expect(success.Envelope.Body.searchAvailableAppointmentListResponse, 'Response should contain searchAvailableAppointmentListResponse\n' + JSON.stringify(success, null, '\t')).not.toBeNull()
            expect(success.Envelope.Body.searchAvailableAppointmentListResponse.availableAppointmentList, 'Response should contain availableAppointmentList\n' + JSON.stringify(success, null, '\t')).not.toBeNull()

            appointmentList = success.Envelope.Body.searchAvailableAppointmentListResponse.availableAppointmentList;
        });

        startDate = DateUtils.convertISOstringToYYYYMMDDhhmmss(appointmentList[0].startDate.toString());
        expect(new Date(startDate).getTime(), 'startDate should be greater than current time' + startDate.toString()).toBeGreaterThan(new Date().getTime())

        endDate = DateUtils.convertISOstringToYYYYMMDDhhmmss(appointmentList[0].endDate.toString());
        expect(new Date(endDate).getTime(), 'endDate should be greater than current time' + endDate.toString()).toBeGreaterThan(new Date().getTime())
    })

    test('[Step 6] Update WO + SO characteristics via CSR for RCA', () => {
        expect.hasAssertions()
        expect(shoppingCartId, 'SC id should be received from previous test').not.toBeNull()
        let distributionChannel = btapi.data.distributionChannel.CSR
        let distributionChannelName = 'CSR'
        let customerCategory = btapi.data.customerCategory.CONSUMER

        var charSalesList = [
            { name: '9151790559313390133', value: null },
            { name: '9151790559313390189', value: null }
        ]

        var charList = [
            { name: '9146582494313682120', value: 'Test Additional Information for Technician!!!' },
            { name: '9146583488613682622', value: 'Test Contact Name' },
            { name: '9146583560513682624', value: '6042202121' },
            { name: '9146584385713682940', value: startDate },
            { name: '9146584120013682838', value: endDate }

        ]

        let body = btapi.generateShoppingCartBody.updateCharsTopItem(customerAccountECID, customerCategory, distributionChannel, externalLocationId, charList, woItemId, charSalesList)


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

        let body = bodySamples.validateOrSubmitBody(customerCategory, distributionChannel)

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

        let body = bodySamples.validateOrSubmitBody(customerCategory, distributionChannel)

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


    test('Complete Order on BE', async () => {
        logger.info("CustomerID:" + customerId)
        btapi.wait(10000);
        const manualTaskId = await du.getManualCreditTaskId(dbcfg, customerId);
        if (!StringUtils.isEmpty(manualTaskId)) {
            const res = await tapis.processManualTask(apicfg, manualTaskId);
            logger.debug(
                `Manual task ${manualTaskId} completion status code: ${res.status}`
            );
        }
        btapi.wait(10000);
        const pendingWorkOrders = await du.getWorkOrderNumbersNotCompleted(
            dbcfg,
            customerId
        );

        logger.info("Work_Order_Number:" + JSON.stringify(pendingWorkOrders))

        for (let orIndex = 0; orIndex < pendingWorkOrders.length; orIndex++) {
            //let orderInternalId = pendingWorkOrders[orIndex][1];
            const workOrderNumber = pendingWorkOrders[orIndex][0];
            logger.info("Work_Order_Number:" + workOrderNumber)
            const workOrderName = pendingWorkOrders[orIndex][2];
            if (StringUtils.containsIgnoreCase(workOrderName, "work order")) {
                // Hit release activation in case order is in entering state
                await tapis.processReleaseActivation(apicfg, workOrderNumber);
                // Wait for 10 seconds to get completed
                await btapi.wait(10000);

                // Hit work order completion
                await tapis.processWorkOrder(apicfg, workOrderNumber);
                // Wait for 10 seconds to get completed
                await btapi.wait(10000);
            }
        }

        logger.debug("Fetching customer's all order item's status");
        const allcustomerOrdStatus = {};
        const allOrdersStatus = await du.select(
            dbcfg,
            dq.queryNcCustomerOrdersStatus(dbcfg, customerId)
        );
        logger.debug(`Orders' statuses: ${JSON.stringify(allOrdersStatus)}`);
        allcustomerOrdStatus.allOrdersStatus = allOrdersStatus;
        logger.debug(
            `Order's statuses till now: ${JSON.stringify(allcustomerOrdStatus)}`
        );

        logger.debug("Fetching customer's all pending order item's status");
        const allPendingOrders = await du.select(
            dbcfg,
            dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
                dbcfg,
                customerId
            )
        );
        logger.debug(
            `Pending Orders' statuses: ${JSON.stringify(allPendingOrders)}`
        );
        allcustomerOrdStatus.allPendingOrders = allPendingOrders;
        logger.debug(
            `Order's statuses till now: ${JSON.stringify(allcustomerOrdStatus)}`
        );
        // storeOutputToDataSetResult(caseResult, datasetindex, allcustomerOrdStatus);

        const custErrors = {};
        custErrors.err = await du.getErrorsOccuredForCustomer(dbcfg, customerId);

        const allnonprocessedOrders = {};
        if (
            allPendingOrders != null &&
            allPendingOrders !== undefined &&
            allPendingOrders.length > 0
        ) {
            for (let orIndex = 0; orIndex < allPendingOrders.length; orIndex++) {
                const orderInternalId = allPendingOrders[orIndex][1];
                const orderName = allPendingOrders[orIndex][0];
                if (StringUtils.containsIgnoreCase(orderName, "shipment")) {
                    // Hit release activation in case order is in entering state
                    await tapis.processReleaseActivation(apicfg, orderInternalId);
                    // Wait for 10 seconds to get completed
                    await btapi.wait(10000);

                    const res = await du.getShipmentOrderNumberAndPurchaseOrderNumber(
                        dbcfg,
                        orderInternalId
                    );
                    // Hit shipment order completion
                    await tapis.processShipmentOrder(
                        apicfg,
                        res.shipmentOrderNumber,
                        res.purchaseeOrderNumber
                    );
                    // Wait for 10 seconds to get completed
                    await sel.getWaitUtils().sleep(10000);

                    allnonprocessedOrders.ordersnotprocessed = await du.select(
                        dbcfg,
                        dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
                            dbcfg,
                            customerId
                        )
                    );
                }
            }
        }

    }, btapi.timeout)

    test('[Step 1] Initiate Change Order', () => {

        let body = btapi.generateShoppingCartBody.generateEmptyCart(customerAccountECID, customerCategory, distributionChannel, externalLocationId)

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
                controlPlusVideoItem = btapi.getByParent('id', controlPlusVideoOffer, body.cartItem)
                expect(controlPlusVideoItem, 'Security offer (' + controlPlusVideoOffer + ') should be present in response\n' + scText).not.toBeNull()
                let commitmentItem = btapi.getByParent('id', commitmentOffer, body.cartItem)
                expect(commitmentItem, 'Commitment offer (' + commitmentOffer + ') should be present in response\n' + scText).not.toBeNull()
                body.cartItem.forEach(function (cartItem) {
                    if (cartItem.productOffering == controlPlusVideoItem) {
                        controlPlusVideoItemId = cartItem.id
                        controlPlusVideoItem = cartItem
                    } else if (cartItem.productOffering == workOffer) {
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

    test('[Step 2] Remove 4 Indoor Equipment for Home Secuirty', () => {
        logger.info("ShoppingCartId:" + shoppingCartId)
        expect(shoppingCartId, 'SC id should not be null, please look at the previous test\n').not.toBeNull()
        expect(controlPlusVideoItemId, 'controlPlusVideoItemId should not be null, please look at the previous test\n').not.toBeNull()

        let removechildOfferList =  []

        controlPlusVideoItem.cartItem.forEach(function (element) {
            if (element.productOffering.id == btapi.data.homeSecurityEquipments.indoorCameraEasy) {
                removechildOfferList.push(element.id)
                }
        })


        let body = btapi.generateShoppingCartBody.removeChildOffers(customerAccountECID, customerCategory, distributionChannel, externalLocationId, removechildOfferList, controlPlusVideoItemId);

        return btapi.$requestShoppingCart(btapi.TYPES.updateShoppingCart(shoppingCartId), body).toPromise().then(
            success => {
                expect(success.response, 'Response field should be present\n' + JSON.stringify(success, null, '\t')).toBeDefined()
                expect(success.response, 'Response field should be present\n' + JSON.stringify(success, null, '\t')).not.toBeNull()
                expect(success.response.body, 'Response field should contain body\n' + JSON.stringify(success, null, '\t')).toBeDefined()
                expect(success.response.body, 'Response field should contain body\n' + JSON.stringify(success, null, '\t')).not.toBeNull()
                const body = success.response.body

                logger.info("RESPONSE:" + JSON.stringify(body))
                expect(body.status, 'SC should have OPEN status\n' + JSON.stringify(success, null, '\t')).toBe('OPEN')
                expect(body.cartItem, 'Response should contain cartItem\n').toBeDefined()
                expect(body.cartItem, 'cartItem should not be null\n').not.toBeNull()
                let scText = JSON.stringify(body.cartItem.map(elem => {
                    return {
                        id: elem.productOffering.id + '   ' + elem.productOffering.displayName
                    }
                }, null, '\t'))
                controlPlusVideoItem = btapi.getByParent('id', controlPlusVideoOffer, body.cartItem)
                expect(controlPlusVideoItemId, 'controlPlusVideo offer (' + controlPlusVideoOffer + ') should be present in response as 2 equipments were added.\n' + scText).not.toBeNull()
                body.cartItem.forEach(function (item) {
                    let product = item['product']
                    expect(item.product.place[0].id, 'Place ID under ' + product.displayName + ' top offer should be the same like Place ID in request\n').toBe(externalLocationId)
                    expect(item['action'], 'Action for offer ' + product['displayName'] + ' should be "-"\n').toBe('-')
                    expect(product['characteristics'].length, 'Characteristics for offer ' + product['displayName'] + ' should be present\n').not.toBe(0)
                    item.productOffering.id == controlPlusVideoOffer ? controlPlusVideoItem = item : null
                    if (item.productOffering.id == workOffer) {
                        woItemId = item.id
                    }
                })


                let actChildren = []
                controlPlusVideoItem.cartItem.forEach(function (childItem) {
                    actChildren.push(childItem['id'])
                    if (removechildOfferList.includes(childItem['id'])) {
                        expect(childItem['action'], 'Action for offer ' + childItem.product['displayName'] + ' should be "-"\n').toBe('Delete')
					}
                })
                removechildOfferList.forEach(element => {
                    expect(actChildren.includes(element), `Child "${element}" for HS offer is missed in response.\n Actual children offers:\n` + actChildren).toBeTruthy()
                })
            },
            error => {
                expect(true, 'Error response is received\n' + JSON.stringify(error, null, '\t')).toBe(false)
            }
        )
    }, btapi.timeout)

    test('[Step 3] Add Equipment for Home Secuirty', () => {
        expect(shoppingCartId, 'SC id should not be null, please look at the previous test\n').not.toBeNull()
        expect(controlPlusVideoItemId, 'controlPlusVideoItemId should not be null, please look at the previous test\n').not.toBeNull()

        let childOfferList = [btapi.data.homeSecurityEquipments.buttonKey];

        logger.info("ChildOfferList" + JSON.stringify(childOfferList));


        let body = btapi.generateShoppingCartBody.addChildOffers(customerAccountECID, customerCategory, distributionChannel, externalLocationId, childOfferList, controlPlusVideoItemId);

        logger.info("BODY:" + JSON.stringify(body));

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
                controlPlusVideoItem = btapi.getByParent('id', controlPlusVideoOffer, body.cartItem)
                expect(controlPlusVideoItemId, 'controlPlusVideo offer (' + controlPlusVideoOffer + ') should be present in response as 2 equipments were added.\n' + scText).not.toBeNull()
                body.cartItem.forEach(function (item) {
                    let product = item['product']
                    expect(item.product.place[0].id, 'Place ID under ' + product.displayName + ' top offer should be the same like Place ID in request\n').toBe(externalLocationId)
                    expect(item['action'], 'Action for offer ' + product['displayName'] + ' should be "-"\n').toBe('-')
                    expect(product['characteristics'].length, 'Characteristics for offer ' + product['displayName'] + ' should be present\n').not.toBe(0)
                    item.productOffering.id == controlPlusVideoOffer ? controlPlusVideoItem = item : null
                    if (item.productOffering.id == workOffer) {
                        woItemId = item.id
                    }
                })

                let expChildren = [
                    btapi.data.homeSecurityEquipments.buttonKey
                ]
                let actChildren = []
                controlPlusVideoItem.cartItem.forEach(function (childItem) {
                    let childProduct = childItem['productOffering']
                    actChildren.push(childProduct['id'])
                    if (childProduct == expChildren[0]) {
                        expect(childItem.action, 'Action for offer ' + childProduct['id'] + ' should be "Add"\n').toBe('Add')
                    }
                    else {
                        expect(childItem.action, 'Action for offer ' + childProduct['id'] + ' should be "Add"\n').toBe('-') || expect(childItem.action, 'Action for offer ' + childProduct['id'] + ' should be "Add"\n').toBe('Delete')
					}
                })
                expChildren.forEach(element => {
                    expect(!actChildren.includes(element), `Child "${element}" for HS offer is missed in response.\n Actual children offers:\n` + actChildren).toBeTruthy()
                })
            },
            error => {
                expect(true, 'Error response is received\n' + JSON.stringify(error, null, '\t')).toBe(false)
            }
        )
    }, btapi.timeout)

    test('[Step 4] Validate SC via SSP for RCA', () => {
        expect.hasAssertions()

        expect(shoppingCartId, 'SC id should not be null, please look at the previous test\n').not.toBeNull()

        let body = bodySamples.validateOrSubmitBody(customerCategory, distributionChannel)

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

    test('[Step 5]: Submit SC via SSP for RCA', () => {
        expect.hasAssertions()
        expect(shoppingCartId, 'SC id should not be null, please look at the previous test\n').not.toBeNull()

        let body = bodySamples.validateOrSubmitBody(customerCategory, distributionChannel)

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