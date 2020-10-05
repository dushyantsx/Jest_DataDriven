const btapi = require('../../../src/bt-api/btapi')
const bodySamples = require('../../../src/bt-api/bodySamples')
const logger = require("../../../src/logger/Logger");
const TelusApis = require("../../../src/utils/telus-apis/TelusApis");
const config = require("../../../br-config")
const DateUtils = require("../../../src/utils/common/DateUtils");

const tapis = new TelusApis();

let envcfg = config.getConfigForGivenEnv();
let apicfg = config.getTelusApisConfig(envcfg);

describe('Provide-2:LW Only AB LivingWell Companion Home Tech Install', () => {
    let shoppingCartId = null
    let woItemId = null
    let lwItemId = null
    let customerAccountECID = null

    let externalLocationId = '2990852'

    let lwOffer = btapi.data.offers.livingWellCompanionHome
    let workOffer = btapi.data.offers.workOffer

    let context = {
        distributionChannel: btapi.data.distributionChannel.CSR,
        customerCategory: btapi.data.customerCategory.CONSUMER,
        locationId: externalLocationId
    }


    let cartVersionBeforeSubmit = null

    let startDate = null
    let endDate = null
    let swt = null

    test('[Step0] Get available Product Offerings', () => {
        let body = bodySamples.getAvailableProductOfferings(context, btapi.data.categories.lwTopCategory)

        return btapi.$requestFull(btapi.TYPES.getProductOffering(), body).toPromise().then(
            success => {
                let response = success.response.body
                const responseText = JSON.stringify(response, null, '\t')
                expect(success.response.statusCode, 'statusCode should be 200.\n' + JSON.stringify(success, null, '\t')).toBe(200)
                expect(response, 'Response should contain body\n' + JSON.stringify(success, null, '\t')).toBeDefined()
                expect(response.productOfferingQualificationItem, 'Response should contain productOfferingQualificationItem\n' + responseText).toBeDefined()

                let actualOffers = []
                let expectedOffers =
                    [
                        "LivingWell Companion Home - Cellular",
                        "Livingwell Companion Home",
                        "Livingwell Companion Home with Fall Detection - Cellular",
                        "Livingwell Companion Home with Fall Detection",
                        "Livingwell Companion Go"
                    ]
                let errorMessage = ''
                response.productOfferingQualificationItem.forEach(function (item) {
                    actualOffers.push(item.productOffering['displayName'])

                })

                /**
                   * Compare ER and AR scope
                   */
                expect(actualOffers.length, '\n Please check amount of items\n' +
                    'ER: ' + expectedOffers.length + '\n' +
                    'AR: ' + actualOffers.length + '\n' +
                    JSON.stringify(response.productOfferingQualificationItem.map(elem => {
                        return {
                            displayName: elem.productOffering.displayName,
                            id: elem.productOffering.id
                        }
                    }), null, '\t')
                ).toBe(expectedOffers.length + 2)

                expectedOffers.forEach(element => {
                    if (!actualOffers.includes(element)) {
                        errorMessage += '\n Item "' + element + '" is missed in response.\n'
                    }
                })
                expect(errorMessage === '', 'Error occurred \:' + errorMessage + JSON.stringify(actualOffers)).toBeTruthy()
            },
            error => {
                expect(true, 'Error response is received\n' + JSON.stringify(error, null, '\t')).toBe(false)
            }
        )
    }, btapi.timeout)

    test('[Step1] Create new RCA via SSP', () => {
        let customerEmail = 'Test_02_' + +btapi.getRandomInt(1, 99999) + 'Jest' + btapi.getRandomInt(1, 99999) + '@email.com'
        let body = bodySamples.createCustomerBody(externalLocationId, customerEmail)

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

    test('[Step 2] Create assigned SC with LW via CSR for RCA', () => {

        var offerList = [lwOffer];

        let body = btapi.generateShoppingCartBody.addTopOffers(customerAccountECID, context.customerCategory, context.distributionChannel, externalLocationId, offerList)

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
                let lwItem = btapi.getByParent('id', lwOffer, body.cartItem)
                expect(lwItem, 'Security offer (' + lwOffer + ') should be present in response\n' + scText).not.toBeNull()
                body.cartItem.forEach(function (cartItem) {
                    if (cartItem.productOffering == lwItem) {
                        lwItemId = cartItem.id
                    } else if (cartItem.productOffering == workOffer) {
                        woItemId = cartItem.id
                    }
                })
                shoppingCartId = body.id
                logger.info("WORK_ITEM_ID" + woItemId);
            },
            error => {
                expect(true, 'Error response is received\n' + JSON.stringify(error, null, '\t')).toBe(false)
            }
        )
    }, btapi.timeout)

    test('[Step 3] Validate Shopping Cart', () => {
        expect(shoppingCartId, 'SC id should not be null, please look at the previous test\n').not.toBeNull()
        expect(lwItemId, 'lwItemId should not be null, please look at the previous test\n').not.toBeNull()

        let body = bodySamples.validateOrSubmitBody(context.customerCategory, context.distributionChannel)

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
                expect(body.cartItem.length, 'cartItem should not be empty - LW and WO\n' +
                    JSON.stringify(body.cartItem.map(elem => {
                        return {
                            id: elem.productOffering.id + '   ' + elem.productOffering.displayName
                        }
                    }))
                ).toBeGreaterThan(0)

                let workOfferItem = btapi.getByParent('id', workOffer, body.cartItem)
                body.cartItem.forEach((item) => {
                    item.productOffering.id == workOffer ? workOfferItem = item : null
                })

                woItemId = workOfferItem.id;

                expect(btapi.getBy('name', '9153916075013425223', workOfferItem.product.characteristics), 'Offer (' + workOffer + ') should contain characteristic 9152694600113929802\n' + JSON.stringify(workOfferItem, null, '\t')).not.toBeNull()

                swt = btapi.getBy('name', '9153916075013425223', workOfferItem.product.characteristics).value
                expect(swt, 'SWT should be equal 1.75\n' + JSON.stringify(swt, null, '\t')).toEqual("1.75")


                let lwItem = btapi.getByParent('id', lwOffer, body.cartItem)
                body.cartItem.forEach((item) => {
                    item.productOffering.id == lwOffer ? lwItem = item : null
                })
                expect(btapi.getBy('name', '9156198150013903799', lwItem.product.characteristics), 'Offer (' + lwOffer + ') should contain characteristic 9156198150013903799\n' + JSON.stringify(lwItem, null, '\t')).not.toBeNull()
                expect(btapi.getBy('name', '9156198150013903799', lwItem.product.characteristics).value, 'Delivery method should be equal to Technician Install\n' + JSON.stringify(swt, null, '\t')).toEqual("9156198150013903802")

                expect(body.cartTotalPrice[0].price.dutyFreeAmount.value, "Price should equal 26.25").toEqual(25)

                let actChildren = []
                let expChildren = ['4200X Base Unit with 2-way communication', 'Personal Help Button']

                lwItem.cartItem.forEach(function (childItem) {
                    let childProduct = childItem['productOffering']
                    actChildren.push(childProduct['displayName'])
                    expect(childItem.action, 'Action for offer ' + childProduct['id'] + ' should be "Add"\n').toBe('Add')
                })
                expect(actChildren.length, '\nAmount of child Items for LW(' + lwOffer + ') should be 2:\n ' + expChildren).toBe(2+1)
                expChildren.forEach(element => {
                    expect(actChildren.includes(element), `Child "${element}" for LW offer is missed in response.\n Actual children offers:\n` + actChildren).toBeTruthy()
                })
                
            },
            error => {
                expect(true, 'Error response is received\n' + JSON.stringify(error, null, '\t')).toBe(false)
            }
        )
    }, btapi.timeout)


    test('[Step 5] Get Search Available Appointments', async () => {
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

        logger.info("WORK ITEM ID" + woItemId);
     
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

    test('Submit SC via SSP for RCA', () => {
        expect.hasAssertions()
        expect(shoppingCartId, 'SC id should not be null, please look at the previous test\n').not.toBeNull()

        let body = bodySamples.validateOrSubmitBody(context.customerCategory, context.distributionChannel)

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