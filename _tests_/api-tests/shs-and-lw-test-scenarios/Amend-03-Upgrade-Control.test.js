const btapi = require('../../../src/bt-api/btapi')
const bodySamples = require('../../../src/bt-api/bodySamples')
const logger = require("../../../src/logger/Logger");
const TelusApis = require("../../../src/utils/telus-apis/TelusApis");
const config = require("../../../br-config")
const DateUtils = require("../../../src/utils/common/DateUtils");

const tapis = new TelusApis();

let envcfg = config.getConfigForGivenEnv();
let apicfg = config.getTelusApisConfig(envcfg);
let customerAccountECID = null
let workOffer = btapi.data.offers.workOffer

describe('Preconditions', () => {

        let shoppingCartId = null
        let woItemId = null
        let secureItemId = null

        let externalLocationId = '2990852'

        let secureOffer = btapi.data.offers.smartHomeSecuritySecure
        let commitmentOffer = btapi.data.offers.homeSecurityCommitmentOn36MonthContract
        let lwOffer = btapi.data.offers.livingWellCompanionHome

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
                    customerAccountECID = success.externalCustomerId
                },
                error => {
                    expect(true, 'Error in creating Customer Account' + JSON.stringify(error, null, '\t')).toBe(false)
                }
            )
        }, btapi.timeout + 100000)

        test('[Step 2] Create assigned SC with SHS+Commitment+LW via CSR for RCA', () => {

            var offerList = [secureOffer, commitmentOffer, lwOffer];

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
                    let secureItem = btapi.getByParent('id', secureOffer, body.cartItem)
                    expect(secureItem, 'Security offer (' + secureOffer + ') should be present in response\n' + scText).not.toBeNull()
                    let commitmentItem = btapi.getByParent('id', commitmentOffer, body.cartItem)
                    expect(commitmentItem, 'Commitment offer (' + commitmentOffer + ') should be present in response\n' + scText).not.toBeNull()
                    let livingWellItem = btapi.getByParent('id', lwOffer, body.cartItem)
                    expect(livingWellItem, 'Living Well offer (' + lwOffer + ') should be present in response\n' + scText).not.toBeNull()
                    body.cartItem.forEach(function (cartItem) {
                        if (cartItem.productOffering == secureItem) {
                            secureItemId = cartItem.id
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


        test('[Step 3] Set Previous Provider for Home Securtiy (Mandatory Parameter)', () => {
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

            let body = btapi.generateShoppingCartBody.updateCharsTopItem(customerAccountECID, customerCategory, distributionChannel, externalLocationId, charList, secureItemId, charSalesList)

            return btapi.$requestShoppingCart(btapi.TYPES.updateShoppingCart(shoppingCartId), body).toPromise()

        }, btapi.timeout)

        test('[Step 4] Get Search Available Appointments', async () => {
            let response = await tapis.processSearchAvailableAppointment(apicfg, externalLocationId);
            let appointmentList = [];
            expect(response.text, 'Response  should be present\n' + JSON.stringify(response.text, null, '\t')).toBeDefined()
            await btapi.parseXmlResponse(response.text).then(function (success) {

                appointmentList = success.Envelope.Body.searchAvailableAppointmentListResponse.availableAppointmentList;
            });

            startDate = DateUtils.convertISOstringToYYYYMMDDhhmmss(appointmentList[0].startDate.toString());

            endDate = DateUtils.convertISOstringToYYYYMMDDhhmmss(appointmentList[0].endDate.toString());

        }, btapi.timeout)

        test('[Step 5] Update WO + SO characteristics via CSR for RCA', () => {
            expect.hasAssertions()
            expect(shoppingCartId, 'SC id should be received from previous test').not.toBeNull()
            let distributionChannel = btapi.data.distributionChannel.CSR
            let distributionChannelName = 'CSR'
            let customerCategory = btapi.data.customerCategory.CONSUMER

            logger.info("END_DATE:" + endDate)
            logger.info("START_DATE:" + startDate)
            logger.info("Work_ITEM_ID" + woItemId)

            let workOfferItem = btapi.getByParent('id', workOffer, body.cartItem)
            body.cartItem.forEach((item) => {
                item.productOffering.id == workOffer ? workOfferItem = item : null
            })

            woItemId = workOfferItem.id;

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


            return btapi.$requestShoppingCart(btapi.TYPES.updateShoppingCart(shoppingCartId), body).toPromise()
        }, btapi.timeout)

        test('[Step 6] Validate SC via SSP for RCA', () => {
            expect.hasAssertions()

            expect(shoppingCartId, 'SC id should not be null, please look at the previous test\n').not.toBeNull()

            let body = bodySamples.validateOrSubmitBody(customerCategory, distributionChannel)

            return btapi.$requestShoppingCart(btapi.TYPES.validateShoppingCart(shoppingCartId), body).toPromise()

        }, btapi.timeout)

        test('Submit SC via SSP for RCA', () => {
            expect.hasAssertions()
            expect(shoppingCartId, 'SC id should not be null, please look at the previous test\n').not.toBeNull()

            let body = bodySamples.validateOrSubmitBody(customerCategory, distributionChannel)

            return btapi.$requestShoppingCart(btapi.TYPES.submitShoppingCart(shoppingCartId), body).toPromise()
        }, btapi.timeout)

     shoppingCartId = null
     woItemId = null
    let controlItemId = null

     externalLocationId = '2990852'

    let controlOffer = btapi.data.homeSecurityOffers.controlOffer

     distributionChannel = btapi.data.distributionChannel.CSR
     customerCategory = btapi.data.customerCategory.CONSUMER

     cartVersionBeforeSubmit = null

     startDate = null
     endDate = null

    test('[Step 1] Create assigned SC with Control 2.0', () => {
        btapi.wait(10000);

        var offerList = [controlOffer];

        let body = btapi.generateShoppingCartBody.addTopOffers(customerAccountECID, customerCategory, distributionChannel, externalLocationId, offerList)

        return btapi.$requestShoppingCart(btapi.TYPES.createShoppingCart(), body).toPromise().then(
            success => {
                const body = success.response.body
                const responseText = JSON.stringify(success, null, '\t')
                expect(success, 'Response should not be empty\n').not.toBeNull()
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
                let controlItem = btapi.getByParent('id', controlOffer, body.cartItem)
                expect(controlItem, 'Security offer (' + controlOffer + ') should be present in response\n' + scText).not.toBeNull()
                body.cartItem.forEach(function (cartItem) {
                    if (cartItem.productOffering == controlItem) {
                        controlItemId = cartItem.id
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

    test('[Step 2] Validate SC via SSP for RCA', () => {
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

})

