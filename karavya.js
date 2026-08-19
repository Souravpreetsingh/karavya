/* ============================================================================
 * KARAVYA — shared commerce runtime.
 * Canonical product registry + cart / wishlist / buy-now + shared UI helpers.
 * Loaded on every page AFTER site-config.js and BEFORE page scripts.
 * Works when opened via file:// (localStorage only) and when served by the
 * KARAVYA backend at / (localStorage + optional /api sync).
 * ========================================================================== */
(function (window, document) {
    'use strict';

    var K = window.KARAVYA = window.KARAVYA || {};

    /* ------------------------------------------------------------------ */
    /* Canonical product registry (mirrors the backend seed data, INR)     */
    /* ------------------------------------------------------------------ */

    var IMG = {
        cloudline: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvgYYTTL1IUyLBH2KQE54rMzKIjWKwPQLeRja0HavbJkLIMG-R1euQViJ8Sgs8iWdBuoiJwGVG6Tnn08Qksg6pTmzDoIi74ntAghp6bmISbOseEws2ToY3bTyIRV12wL52mNDMzVdeFM-nTAjyNOKXkfBLDHZeTbhiBgLyu4gJytAVIwlmbORn6LMq6oUhBnxtE0P3xxYL7o42gC7H8ADaxR8Cr1r3Yxogktebnx2tz-ORrawo8z5q',
        cloudlineAlt: 'https://lh3.googleusercontent.com/aida/AP1WRLumdyn1n7arqnhFmUR7laeunIILn9AsX1VzQaGZmK9RxRA7tN3pkmwCSVe0NTIBY-uR9Uw-TqI0r_SJlIrHisqX-umb230fVsmzxHxhiiwZjtHYRPsENGj5ebLWziNXzQr3A10KYS7qR9xqlF5fdm2CLXRNGN7sL7QMjOrSK5tGG88GJ9ZVW18FyU6ZB0PZnCSCq1AqLomLp_GaZ8J-968PMpFwpIEmisdpxM23aUzfG8AWmfo3Ke1BS_w',
        robe: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDg4kQ-HQw5cWWrgEedCeBl5piO0z9l-CKUw3kAquVWDFd9B0nTewQtCkJzJLxHwDzAJRMUriJ2cdEnDXZJJekq2Qcv-FvfREZglEYlcG6A37C24jF2IxyH-_fVE_cZn705rTLQQWQSKxj5BG8SAT2WYAamvGINx84WgTToG1wZdad1HRzDK6m9T3VNsu5q1dnP99JHt4nPNMeNx-xJHU5QZzFIJCJeto1TaWMZlFoKGIFV6AMqbDcq',
        robeAlt: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD34Mditi3uJsyqUmQtcIgEMEF7pfErogXiZfEp79MAp9LcUoCNee2y2MVGZacMMe0scroK0OosfbqX8vJUG3MuR3LismgaohqyrWSFkKWpdZ2kLuk5VvMlK6Eign5TBPcX6e9sRJ8gRYiCueeUSNEZPFmVEe_BbHfuV6EUSOpx3JMlUKjfk4_EKF1n_kpJwbf0r4fV2jtJE9wPeEqn26scyYfazkBKENWbjbkNDBSvHpX05H4gaUCD',
        serene: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVSAio_h7b_lIM82i8qVIXuBMDRINOghKgwk2s6shqm0X0jXxh2TQLR84Te-yQ0118cBp8cgUXZiwCAMz5YneQQa3g8nMW1w-YflBesJXOx53hggx2N1F40kegUlRBo_Csdte-0oO4U2eUXBoGFpS2xiRlNzRAeVWtjmMkVsCmx9k6cN7XR9mwALk-gXQwFd3No-vIYRgQbzCdmlxOcmRzXWIvkbnD57j4HcGehkyWDvLavD9qiOPN',
        slip: 'https://lh3.googleusercontent.com/aida/AP1WRLu-HqiVACSHQRCQ1TMlKRRXCVC4tZvA9hgjhfdwa6MJgWasDVH5TAWX-n8NfOrw6SqBKMVD7WpXjuMU6SzZtrg5TXGIOsCFUxVO_264W69Urg_TfakvsjDUoWF42xTG4if9vXRBEdMrh7ZuxU4-zKcRjkd6Sb0phE9laQzOFa-T7JfH_nFv8JZOuyu27CRm4sFgeCynBAtIIugIdeiLmYCuPy7whRvJyV_0-BK33xrgUX7clSbPmungpZw',
        slippers: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPcogrYurt9HkVV2S_i9zPPjQ_5u3QgD67xEmQl1gEw3CRn1Lyxy63uAeSm9AW5zHbgLSQ3DYXLsL8og2tW0HKj9mJcAxcbyNWGX35Qiu5ODdVvcUZCsdtiqXncCztk3JdMO1tOIbjL4rE7_7iNVbnnq6LQiCBHmD8_SIpDOd2Vn0s0DyfWu1HUrJc6YVm2hDg9V6Bxstn8GGZq4FgJmkGQDYXc9Xhca2k70E5PzwVGf70fRNerNW2',
        sleepMist: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKIjZ4Vnp5odlM2230swuTCY8_UC_M7pfW7oPBDrtZJvTeVgT_BM8BqnPvAkMyK-mgAhiaT3dDYKGUJsGKQlhQpw0LhGhBqGTNuMJq7y-YyiWi-VxVPUg4SbimiX6zYQrh2NZFUHZsji0RopCwWnPeBF4Zdm_KrU0tMI5d_kl6lBPZbE2no-7asVjUPSQrDWzipIN14VXirAgJ9xgpWVk7uX2zfieu34gQ6czzTq3wMPDPpLLhjCwi',
        etherealSilk: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbF_MfMCkI1JenrqKSgXz_eozpRNsPKBGPjxFdfATCdqp4vPUnFKFdZqDwFTf7LXY2frOrXxP8D-cVbTS3Pcxn6BOagGQqnH7Vc2JnKgBRSOuZL4QWsSHgFLU_0ceW5grb0ZJM7d-yS4fnuysMsV2r_JEV3dicVuYklKDxxSna2AyfBqhkHIaDblovC-qQZXcmpRt1PHU2g77qbkk033f3bT0xWD9XujPELcyu_bGlbU2sW-rLNCOZ',
        linenCami: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1MeYqtI_T6Pb-Mm09-EavRE5t8UHK24TWr96kJF9NOb9Gvp4-ssL4dWQudMgHUqhhfLPUclNJRoQClEH4R7OU32d9ihrEKUxHrfCtDFiGdlaeIygUBvknJDQU_mwjBN6-6DuqIFS7epMHwypk2O-U6B8-IVerlfkv63pAvRWRUeiNL3Fqb5VOLVDtp9pzJQSi8NL9NVpOVRoQlqHKl1NIBgfZC85dLPAc9A2xMcdijTt-9h-gacOx',
        sleepShirt: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPrj9iIhMFRR60r3NeAp8PyslqKJsDYYqfB8U0olote8ecyFif0kRs5kVnZugfzKeA5sYCH-OFjo5EQi40asipwtc6rNckJ0SODtp-5-7MqE5_ylI3Wsy1YkYTlwxZHnDkb0PYEjwMvLyokPC3m728ohwAuiPs0I3WDNHoCyFw3pKTUwO6TUrPM3pqqMH67XwvikliX3oAo7-Be99BDJdx7d3pFMxCbRbILKuk79wAecxHsWwfmXrE',
        sunday: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAl5hiOGrUIc_USnL8xcdaVPu5xB1-Ry5wSB7x_16N3P-5WKbq1o-rTVpj4Q7J1xTZXcT4BNKCgrIyq4jouOHd7SGxKZFGqoHux1oDq1Kuka-fYQl3IGWSxQy3ZqdDzstlx4EJAgUAeE5tvzZElVVAbYcyQjLe8bVGNsaVOYRdUw_TUGXxLek8hbIcaIVulZcSebDHvIn2aIeviyTe-7Jickm2hx86syiT-UB5_RPwPFhYN_CRSUOxm',
        pearl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFU982qnudtGyagld6QA4q5tafMoVt0bLFZK1JSSMUPLc9YYzwoOfcdLDpJq_tsB9yJDU_NUY1M_gIrNHuABJB5i2JHl6MXU4xImvlUfdhpu3ElaBsRavElDGNEccYmXs9M0JKHCG1NL1UWWOiKtqBsvdwQBQlq7hJQWMRduavkzwCChFhESo8xAFfeU5INRhUKRD86gdkyE3XN-BP_OFXr3D_1rQkUMAiixTZBzAMPbyB3h3__DbT',
        modalLounge: 'https://lh3.googleusercontent.com/aida/AP1WRLtvvQhFQ7tryPGIP4X92XMTN61jYy3FfnBDaGZdsJvAPnnulRAaFRVEVlAuRJmlClFsDC03qFZvAqxh_xfLE67IJjEmTlUJqtbDXUK5LRo_vOFXj-lyupsekW2FYNLcAZm6jT9T1CaYhMbiOW8IlnB8xKxVywH8kr8UA51tv6vDdpc46i8JSxTXkhD1L2doSQkMYraEf9LgBNV88ZZYpOpSST_07hCRn7uKIxik_dPg8y136wM5ZBRNeuY',
        silkBlouse: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaKp91XwnxgogobJnWNulLO040kSffH_IMJjrruY07CRvRPzTEJXStSYacSNPW_frKsaXlhuSAiTuPGgTqy2mQqILV4I7APNxPNIcjKmMPvUw1H_k9LiiLQjI3bF8t9P1_YJZ5Kt5NyUUEkMVtQKOnpKcbMMy_NcNQAjQmGP3q8Gwmv_V9dyKWV_bKZ6Hxqu48mm1umz5DHlNrflliaiRvMc68WR9Bkwet_wz_Rr4An94MzO51oMy7',
        elysian: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5imognXRZuDlsfAiy6TubBunr7bF1sk63Gx-eEAO-nxHweL2Hhb1RvWa5D_APIyLXCJjzw6PBaVavShgri0z29Zd3RBP6KPQQYcB9FUC3HOXpruyycmQY0ccFPBsXMNDcXe4U5u55NdfkpWoQ0-fY0olWoRwujSUwdhdtncwPZxuaO2_8kbqvXayEM2Xe4sGqTdGjr3O6LlfaC3ojlEfJOdRVBnt5EtBd5_RIR2ymv-2Z34NSbRjE',
        mask: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB13mTS5HMY6RHJ_M-dKUORmu0ePttMGaXJeQtvhomSTQqwGG4YBMl0Ol6Y-ZNLOSHCm-vyYY9hNEeg5PXruhsRe3tyhgh50jpAFw3CKhLobcD-wyozK6-kLccCCO8_iSfpSINSEpoqh89lrBmQmlspUCXEZ_2FQgblNjVxQamZ0uks02ttDewhx3x-kwWstfCUITzY1UiJlnJgW0_Fr2kkeEh6YhBnAHhuydYP9FqrjPK0BRrQf4Sp',
        roseCloudSet: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdaLSKdVVM_hkdKCaKYWpUyqllw4xWcZ8T9R_CvCQVSSHAO6h6aqpgo3Lqi874BQhH7lejN97bJgptwUykBP3ePuNBWBEguWIGaeiHCFHFY0t_qWxyCYRV_YdknYtngj4vDzFa1qg6y4-E6EgOFknq1WOlEYG-3VjTH__cvPgeEdAcWQEjNvQEThHNL70QxPD6DHs0JKgyQUpMHx6RzAtvgWA-U6n_JcBMg0foQD_xrVOXebQna6Ms',
        midnight: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgufMSP5eCK707Fe8AXp5fg6vjpyTdoxad4uYThqxdOY0fNpqeAon6YXM0YdxWWNPqx9DcsZrm6nxNFuqpjTWV1cqMTaJUJWnPGh3_8FmhHVh0kKfrqDF0M1drZRy7c6n8JV6dL1NKoEoW7LrN-46785w4libq3tS0LnLK-92TG6p_fMty9Anf-B_Q2UOwiv5m6RR9Xy9T67mW3y0Qq--cSN4o7JPjros3I8xeglTQvdLLqjQCeA_D',
        bespoke: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDW938YiHjsKCmHXI6kgeY4di5sy8uFVJunTUfLLnTkxv-DQHnnvmVWIyk1bffn548MWRsnKk3MMtC69gZWQz3Ae8f3Cd5lnpDKhU4Z6oN1kLTRM_4BvaCPz0T5U59D2VG2AI-9VOHT57_9-HHh5DuuUme5U1c-U04b_z3_eG_7d-zS2fMGohwBy4u98PAPXrFq-dd-JWuC-h5AFfBoeYLkWcOt0CAx66VxwWMOdxpiGDMsntl7MxNj',
        gown: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhbarqBMR7k4V03yjmlBYOWID0EqOsxc-e9fLgk3mkhqhLmDv263bF_xsunmzbJ3YGPpdqSddzetk_oFqjsQmjB7PyfSn_b3EV0sC14jittlG6r4YOftqH7T8pUHSqTcidc-FVjClTrctNpMBiEg1HB-LNQMqT42ULCvVItdsHVvv7BUo8hVY1zbSyKh4uiDiuZVfJ3NIxJN66QUDYLXlX8rBv5kOkIS1koFAHNcKfjo8_g9Xn8Wh2',
        wrap: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVkX3qXqx5up32VzMv02L1tAfyMsWRHHh-uYO0aT2JArqFEfHqCnHzDgvY8stsxCQDV--LyRi2O0-TJbV-q6YH4P-BsqEblKOW94eKmYX6YG8DH9BSf9hXJdL2yVnbt6fOrSTEPiMHs-mxo_8xAZYL5LYj4tNO1t7ykpdn-sITIhGY04Cs589mMVuGqiYQKPTAj2rSlnmIrrnwiZqgeaGKbLJ9UWKI5riceQiN0W27fT7wdryT8JiB',
        camiSet: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAa43bnvBp7otbaV9ul2HMPNJXHKS-q_LJF9NaB3dHCvrZrH0mGqeE-QMEJnX9Ci9aj7pBcJ2lh2G2qCNPZcVH4ghzUKf0ulgCXP7e33SlYkiHjOkN3gaJWA9znCvNxvzEvT_ODOnzuk48k-ufWYkjyJROkgs374PHH6b-21BNTqPIjiekhldQUah0hlfCEbS4yrrVOBNijhVp1qq7vPi3qXDT67r7uImiGv-PpCVBpaEW9Xw8L2-DG',
        crossbody: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDurlm4jXi1-xjO5bjeLFDuTXQDLLFgIcAHK-xYmSszarBYc_yRp27fHg6FuI9hE0K5vhZWca-1ziqt4WdfAkA4wUdm2lFvQ5pYoIkipw9nC5NH_fEuqW0-gi0oJ508UFRkJBmufyERbORiKekKtM_Z3nnekc_zMVj0HmzduQoMpomtbCbP3WQ72YrksOtzzZSUGh1dwD7r8V_0GaT3YNNWlUKrZlkEnBv7F3LpESXT46OGCGOpJd3m'
    };

    /* slug, name, price, compareAt, category, material, description, colors, sizes, stock, availability, collection, img */
    var RAW = [
        ['cloudline-modal-set', 'Cloudline Modal Set', 2499, 3999, 'Loungewear', 'Premium modal', 'Premium modal lounge set with soft-touch, breathable, relaxed fit.',
            [{ name: 'Rose', hex: '#fcecef' }, { name: 'Cream', hex: '#fffdfd' }, { name: 'Espresso', hex: '#3d2c30' }, { name: 'Sand', hex: '#f4e2d8' }],
            ['XS', 'S', 'M', 'L', 'XL', 'XXL'], 24, 'in_stock', 'loungewear', [IMG.cloudline, IMG.cloudlineAlt]],
        ['rose-cloud-robe', 'Rose Cloud Robe', 2999, 3999, 'Robes', '95% TENCEL Modal, 5% Spandex', 'Signature robe with removable waist tie, in-seam pockets and French seams.',
            [{ name: 'Rose White', hex: '#FFF5F7' }, { name: 'Midnight Noir', hex: '#2B1B1F' }, { name: 'Taupe Mist', hex: '#896f62' }],
            ['XS', 'S', 'M', 'L'], 30, 'in_stock', 'robes', [IMG.robe, IMG.robeAlt]],
        ['serene-satin-coord', 'Serene Satin Co-Ord', 3498, null, 'Loungewear', 'Satin', 'Fluid satin co-ord set.',
            [{ name: 'Champagne', hex: '#E7C7B7' }, { name: 'Pearl', hex: '#F8DCE3' }],
            ['XS', 'S', 'M', 'L', 'XL'], 18, 'in_stock', 'loungewear', [IMG.serene]],
        ['satin-haze-set', 'Satin Haze Set', 4499, null, 'Robes', 'Satin', 'Fluid satin evening lounge.',
            [{ name: 'Deep Champagne', hex: '#D4C3B3' }],
            ['XS', 'S', 'M', 'L'], 2, 'low_stock', 'robes', [IMG.slip]],
        ['cloud-slippers', 'Cloud Slippers', 1299, null, 'Accessories', 'Plush', 'Complete the ritual. Plush slippers in soft rose tones.',
            [], [], 40, 'in_stock', 'loungewear', [IMG.slippers]],
        ['aura-sleep-mist', 'Aura Sleep Mist', 899, null, 'Wellness', 'Essential oils', 'A restful linen and room mist for the wind-down hour.',
            [], [], 50, 'in_stock', 'loungewear', [IMG.sleepMist]],
        ['ethereal-silk-robe', 'Ethereal Silk Robe', 5999, null, 'Robes', 'Silk', 'An ethereal silk robe for the evening hour.',
            [{ name: 'Rose White', hex: '#FFF5F7' }],
            ['XS', 'S', 'M', 'L'], 12, 'in_stock', 'robes', [IMG.etherealSilk]],
        ['breeze-linen-cami', 'Breeze Linen Cami', 1899, null, 'Loungewear', 'Linen', 'Breeze linen camisole in warm neutrals.',
            [{ name: 'Oatmeal', hex: '#f4e2d8' }],
            ['XS', 'S', 'M', 'L'], 26, 'in_stock', 'loungewear', [IMG.linenCami]],
        ['boyfriend-sleep-shirt', 'Boyfriend Sleep Shirt', 2199, null, 'Sleepwear', 'Cotton', 'A relaxed, easy sleep shirt.',
            [{ name: 'Rose White', hex: '#FFF5F7' }],
            ['XS', 'S', 'M', 'L', 'XL'], 20, 'in_stock', 'loungewear', [IMG.sleepShirt]],
        ['sunday-robe-set', 'The Sunday Robe Set', 6499, null, 'Gifting', 'Silk blend', 'The complete Sunday robe ritual, gift-wrapped.',
            [{ name: 'Rose White', hex: '#FFF5F7' }],
            ['XS', 'S', 'M', 'L'], 10, 'in_stock', 'gifting', [IMG.sunday]],
        ['pearl-edit', 'The Pearl Edit', 3899, null, 'Gifting', 'Curated', 'A curated pearl-toned gift edit.',
            [{ name: 'Pearl', hex: '#F8DCE3' }],
            [], 15, 'in_stock', 'gifting', [IMG.pearl]],
        ['modal-lounge-set-the', 'The Modal Lounge Set', 5299, null, 'Gifting', 'Modal', 'The premium modal lounge set, presented as a gift.',
            [{ name: 'Rose', hex: '#fcecef' }, { name: 'Sand', hex: '#f4e2d8' }],
            ['XS', 'S', 'M', 'L', 'XL'], 9, 'in_stock', 'gifting', [IMG.modalLounge]],
        ['silk-crepe-blouse', 'Silk Crepe Blouse', 4499, null, 'The Edit', 'Heavy silk crepe', 'Heavy silk crepe blouse from the season lookbook.',
            [{ name: 'Pearl Rose', hex: '#FCECEF' }],
            ['XS', 'S', 'M', 'L'], 14, 'in_stock', 'the-edit', [IMG.silkBlouse]],
        ['elysian-robe', 'The Elysian Robe', 7499, null, 'Robes', 'Silk blend', 'The robe from the Art of Slow Living story.',
            [{ name: 'Champagne', hex: '#E7C7B7' }],
            ['XS', 'S', 'M', 'L'], 8, 'in_stock', 'robes', [IMG.elysian]],
        ['aura-lounge-set', 'Aura Lounge Set', 6499, null, 'Loungewear', 'Modal', 'The Aura lounge set from the editorial story.',
            [{ name: 'Rose White', hex: '#FFF5F7' }],
            ['XS', 'S', 'M', 'L', 'XL'], 11, 'in_stock', 'loungewear', [IMG.cloudlineAlt]],
        ['restoration-mask', 'Restoration Mask', 2499, null, 'Wellness', 'Silk', 'An overnight restoration mask.',
            [], [], 32, 'in_stock', 'loungewear', [IMG.mask]],
        ['rose-cloud-set', 'Rose Cloud Set', 3299, null, 'Loungewear', 'Silk blend', 'Signature silk blend loungewear. Bestseller.',
            [{ name: 'Rose', hex: '#fcecef' }],
            ['XS', 'S', 'M', 'L', 'XL'], 21, 'in_stock', 'loungewear', [IMG.roseCloudSet]],
        ['midnight-edit-pj', 'Midnight Edit PJ Set', 2899, null, 'Sleepwear', 'Cotton', 'Classic piped sleepwear.',
            [{ name: 'Midnight Noir', hex: '#2B1B1F' }],
            ['XS', 'S', 'M', 'L', 'XL'], 0, 'out_of_stock', 'loungewear', [IMG.midnight]],
        ['bespoke-robe', 'The Bespoke Robe', 9499, null, 'Robes', '100% Mulberry Silk', 'The bespoke robe from the season lookbook.',
            [{ name: 'Champagne Rose', hex: '#E7C7B7' }],
            ['XS', 'S', 'M', 'L'], 5, 'in_stock', 'the-edit', [IMG.bespoke]],
        ['fluid-gown', 'The Fluid Gown', 12999, null, 'The Edit', 'Fluid satin', 'Ethereal slip dress with crossover straps.',
            [{ name: 'Pearl', hex: '#F8DCE3' }],
            ['XS', 'S', 'M', 'L'], 6, 'in_stock', 'the-edit', [IMG.gown]],
        ['modal-lounge-set', 'Modal Lounge Set', 2499, null, 'Loungewear', 'Modal', 'Signature modal wrap with matching trousers.',
            [{ name: 'Rose', hex: '#fcecef' }, { name: 'Sand', hex: '#f4e2d8' }],
            ['XS', 'S', 'M', 'L', 'XL'], 28, 'in_stock', 'loungewear', [IMG.modalLounge]],
        ['silk-slip-dress', 'Silk Slip Dress', 3499, null, 'The Edit', 'Silk', 'Fluid silk that catches candlelight.',
            [{ name: 'Pearl', hex: '#F8DCE3' }],
            ['XS', 'S', 'M', 'L'], 17, 'in_stock', 'the-edit', [IMG.slip]],
        ['modal-slip-gown', 'Modal Slip Gown', 4999, null, 'Sleepwear', 'Modal', 'A long, flowing rose modal sleep dress that drapes like water.',
            [{ name: 'Rose', hex: '#fcecef' }],
            ['XS', 'S', 'M', 'L'], 14, 'in_stock', 'loungewear', ['https://lh3.googleusercontent.com/aida-public/AB6AXuAxknezAaUe4YEfid9J1bqKdXaM3wbSXE5gmMP_xrt-AwU3QTi4HlXqc3LgDJSeAGIhyKI6lzzKWOKQPRxh-totXpY8ayZ0oy-U8_qZrGuL9Sp1ryXI_A0PwOcLZcqwXCEdXNkb9o3IxxQWLmPDgptZTUFTio6CQewNB9lbcje_rZXbEHdmoCMsN5lKCbYoDL3lEU7_v77CGcNgalwHOoq31oIa6VkSwJuMmhtFRfePgKAuMbySwZbj']],
        ['signature-modal-wrap', 'Signature Modal Wrap', 3299, null, 'Loungewear', 'Modal', 'The signature modal wrap.',
            [{ name: 'Rose White', hex: '#FFF5F7' }],
            ['XS', 'S', 'M', 'L', 'XL'], 22, 'in_stock', 'loungewear', [IMG.wrap]],
        ['ethereal-cami-set', 'Ethereal Cami Set', 2199, null, 'Loungewear', 'Satin', 'Cami set in ethereal tones.',
            [{ name: 'Pearl', hex: '#F8DCE3' }],
            ['XS', 'S', 'M', 'L'], 19, 'in_stock', 'loungewear', [IMG.camiSet]],
        ['sunday-robe', 'The Sunday Robe', 4599, null, 'Robes', 'Silk blend', 'The Sunday robe in soft champagne tones.',
            [{ name: 'Champagne', hex: '#E7C7B7' }],
            ['XS', 'S', 'M', 'L'], 13, 'in_stock', 'robes', [IMG.sunday]],
        ['minimal-crossbody', 'Minimalist Crossbody', 1500, null, 'Accessories', 'Vegan leather', 'Minimalist crossbody bag in deep espresso.',
            [{ name: 'Deep Espresso', hex: '#2B1B1F' }],
            [], 25, 'in_stock', 'the-edit', [IMG.crossbody]],
        ['linen-resort-shirt', 'Linen Resort Shirt', 1499, null, 'Loungewear', 'Linen', 'Linen resort shirt in oatmeal.',
            [{ name: 'Oatmeal', hex: '#f4e2d8' }],
            ['S', 'M', 'L'], 16, 'in_stock', 'loungewear', [IMG.crossbody]]
    ];

    var PRODUCTS = RAW.map(function (r) {
        return {
            id: r[0], slug: r[0], name: r[1], price: r[2], compareAt: r[3], category: r[4],
            material: r[5], description: r[6], colors: r[7], sizes: r[8],
            stock: r[9], availability: r[10], collection: r[11], images: r[12]
        };
    });

    var bySlug = {};
    PRODUCTS.forEach(function (p) { bySlug[p.slug] = p; });

    K.PRODUCTS = PRODUCTS;
    K.find = function (slug) { return bySlug[slug] || null; };
    K.productUrl = function (slug) { return 'product.html?p=' + encodeURIComponent(slug); };
    K.CATEGORIES = ['Loungewear', 'Robes', 'Sleepwear', 'Accessories', 'Wellness', 'Gifting', 'The Edit'];
    K.COLLECTIONS = [
        { slug: 'loungewear', name: 'Loungewear' },
        { slug: 'robes', name: 'Robes' },
        { slug: 'new-arrivals', name: 'New Arrivals' },
        { slug: 'gifting', name: 'Gifting Studio' },
        { slug: 'the-edit', name: 'The Edit' }
    ];

    K.search = function (q) {
        var term = String(q || '').trim().toLowerCase();
        if (!term) return PRODUCTS.slice();
        return PRODUCTS.filter(function (p) {
            return (p.name + ' ' + p.description + ' ' + p.category + ' ' + p.material).toLowerCase().indexOf(term) !== -1;
        });
    };

    K.filter = function (opts) {
        opts = opts || {};
        var list = PRODUCTS.filter(function (p) {
            if (opts.category && p.category !== opts.category) return false;
            if (opts.collection && p.collection !== opts.collection) return false;
            if (opts.availability && p.availability !== opts.availability) return false;
            if (opts.minPrice != null && p.price < opts.minPrice) return false;
            if (opts.maxPrice != null && p.price > opts.maxPrice) return false;
            if (opts.size && p.sizes.indexOf(opts.size) === -1) return false;
            if (opts.color && !p.colors.some(function (c) { return c.name.toLowerCase() === String(opts.color).toLowerCase(); })) return false;
            if (opts.inStockOnly && p.availability === 'out_of_stock') return false;
            return true;
        });
        if (opts.sort === 'price-asc') list = list.slice().sort(function (a, b) { return a.price - b.price; });
        else if (opts.sort === 'price-desc') list = list.slice().sort(function (a, b) { return b.price - a.price; });
        else if (opts.sort === 'name') list = list.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
        return list;
    };

    K.related = function (slug, n) {
        var p = bySlug[slug];
        if (!p) return [];
        var n2 = n || 3;
        var same = PRODUCTS.filter(function (x) {
            return x.slug !== slug && (x.category === p.category || x.collection === p.collection) && x.availability !== 'out_of_stock';
        });
        var fill = PRODUCTS.filter(function (x) { return x.slug !== slug && x.availability !== 'out_of_stock'; });
        return same.concat(fill).slice(0, n2);
    };

    K.fmtINR = function (rupees) {
        if (rupees == null || Number.isNaN(Number(rupees))) return '';
        return '₹' + Number(rupees).toLocaleString('en-IN');
    };

    /* ---------------------------------------------------------------- */
    /* Storage                                                           */
    /* ---------------------------------------------------------------- */

    var CART_KEY = 'karavya_cart';
    var WISH_KEY = 'karavya_wishlist';
    var BUY_KEY = 'karavya_buy_now';
    var USER_KEY = 'karavya_user';
    var TOKEN_KEY = 'karavya_token';
    var LAST_ORDER_KEY = 'karavya_last_order';
    var PENDING_KEY = 'karavya_pending_order';

    K.isFileProtocol = (window.location && window.location.protocol === 'file:');

    function read(key, fallback) {
        try {
            var v = JSON.parse(window.localStorage.getItem(key));
            return v == null ? fallback : v;
        } catch (e) { return fallback; }
    }
    function write(key, value) {
        try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    }

    /* ---------------------------------------------------------------- */
    /* Cart                                                              */
    /* ---------------------------------------------------------------- */

    function hydrateItem(raw) {
        var p = bySlug[raw.id] || null;
        return {
            id: raw.id,
            qty: Math.max(1, parseInt(raw.qty, 10) || 1),
            size: raw.size || '',
            color: raw.color || '',
            name: p ? p.name : (raw.name || '(unavailable piece)'),
            price: p ? p.price : (parseInt(raw.price, 10) || 0),
            img: p ? p.images[0] : (raw.img || ''),
            product: p
        };
    }

    K.getCart = function () {
        return read(CART_KEY, []).map(hydrateItem).filter(function (i) { return i.product; });
    };
    K.saveCart = function (items) { write(CART_KEY, items); };
    K.cartCount = function () {
        return K.getCart().reduce(function (n, i) { return n + i.qty; }, 0);
    };

    K.cartTotals = function (items) {
        items = items || K.getCart();
        var subtotal = items.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
        var shipping = (subtotal >= 5000 || subtotal === 0) ? 0 : 500;
        var tax = Math.round(subtotal * 0.05);
        return { subtotal: subtotal, shipping: shipping, tax: tax, total: subtotal + shipping + tax, items: items.length };
    };

    K.addToCart = function (slug, opts) {
        opts = opts || {};
        var p = bySlug[slug];
        if (!p) return { ok: false, message: 'Piece not found.' };
        if (p.availability === 'out_of_stock') return { ok: false, message: 'This piece is currently sold out.' };
        var size = opts.size || '';
        if (p.sizes.length && !size) return { ok: false, message: 'Please select your size.' };
        var qty = Math.max(1, parseInt(opts.qty, 10) || 1);
        if (qty > 10) return { ok: false, message: 'Maximum quantity is 10.' };
        if (p.stock > 0 && qty > p.stock) return { ok: false, message: 'Only ' + p.stock + ' available.' };

        var items = K.getCart();
        var found = null;
        for (var i = 0; i < items.length; i++) {
            if (items[i].id === slug && (items[i].size || '') === size && (items[i].color || '') === (opts.color || '')) { found = items[i]; break; }
        }
        if (found) {
            var totalQty = found.qty + qty;
            if (totalQty > 10) return { ok: false, message: 'Maximum quantity is 10.' };
            if (p.stock > 0 && totalQty > p.stock) return { ok: false, message: 'Only ' + p.stock + ' available.' };
            found.qty = totalQty;
        } else {
            items.push({ id: slug, qty: qty, size: size, color: opts.color || '' });
        }
        K.saveCart(items);
        K.renderCounts();
        return { ok: true, message: 'Added to bag — ' + p.name };
    };

    K.setCartQty = function (slug, size, qty) {
        var items = K.getCart();
        for (var i = 0; i < items.length; i++) {
            if (items[i].id === slug && (items[i].size || '') === (size || '')) {
                qty = parseInt(qty, 10) || 0;
                if (qty < 1) { items.splice(i, 1); }
                else {
                    if (qty > 10) qty = 10;
                    var p = bySlug[slug];
                    if (p && p.stock > 0 && qty > p.stock) qty = p.stock;
                    items[i].qty = qty;
                }
                K.saveCart(items);
                K.renderCounts();
                return true;
            }
        }
        return false;
    };

    K.removeFromCart = function (slug, size) {
        var items = K.getCart().filter(function (i) { return !(i.id === slug && (i.size || '') === (size || '')); });
        K.saveCart(items);
        K.renderCounts();
    };

    K.clearCart = function () { write(CART_KEY, []); K.renderCounts(); };

    /* ---------------------------------------------------------------- */
    /* Buy-now context (single-piece purchase, never touches the bag)    */
    /* ---------------------------------------------------------------- */

    K.buyNowGet = function () { return read(BUY_KEY, null); };
    K.buyNowSet = function (slug, opts) {
        opts = opts || {};
        var p = bySlug[slug];
        if (!p || p.availability === 'out_of_stock') return { ok: false, message: 'This piece is not available.' };
        if (p.sizes.length && !opts.size) return { ok: false, message: 'Please select your size.' };
        write(BUY_KEY, { slug: slug, qty: Math.max(1, parseInt(opts.qty, 10) || 1), size: opts.size || '', color: opts.color || '' });
        return { ok: true };
    };
    K.buyNowClear = function () { try { window.localStorage.removeItem(BUY_KEY); } catch (e) {} };

    /* Order source: buy-now context wins over the bag */
    K.orderLines = function () {
        var bn = K.buyNowGet();
        if (bn && bySlug[bn.slug]) {
            var p = bySlug[bn.slug];
            return [{ id: p.slug, qty: Math.max(1, parseInt(bn.qty, 10) || 1), size: bn.size || '', color: bn.color || '', name: p.name, price: p.price, img: p.images[0], product: p, buyNow: true }];
        }
        return K.getCart();
    };
    K.hasOrderSource = function () { return K.orderLines().length > 0; };

    /* Shipping rule mirrors the backend: ₹500 standard under ₹5,000, free at/above */
    K.shippingFor = function (subtotal, express) {
        var free = subtotal >= 5000 || subtotal === 0;
        if (express) return { label: 'Express', amount: 500 };
        return { label: free ? 'FREE' : 'Standard', amount: free ? 0 : 500 };
    };

    K.checkoutSummary = function (express) {
        var lines = K.orderLines();
        var subtotal = lines.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
        var delivery = K.shippingFor(subtotal, express);
        var discount = 0;
        var tax = Math.round(subtotal * 0.05);
        return {
            lines: lines, source: lines.length && lines[0].buyNow ? 'buy-now' : 'cart',
            count: lines.reduce(function (n, i) { return n + i.qty; }, 0),
            subtotal: subtotal, discount: discount, delivery: delivery, tax: tax,
            total: subtotal + delivery.amount + tax - discount
        };
    };

    K.writePendingOrder = function (opts) {
        opts = opts || {};
        var s = K.checkoutSummary(opts.express);
        var order = {
            id: 'KR-DEV-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
            items: s.lines.map(function (i) { return { id: i.id, name: i.name, price: i.price, qty: i.qty, size: i.size || '', color: i.color || '', img: i.img || i.image || '' }; }),
            subtotal: s.subtotal, discount: s.discount, delivery: s.delivery.amount,
            deliveryLabel: s.delivery.label, tax: s.tax, total: s.total,
            currency: 'INR', source: s.source, demo: true, placedAt: new Date().toISOString()
        };
        try { window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(order)); } catch (e) {}
        write(PENDING_KEY, order);
        return order;
    };

    /* ---------------------------------------------------------------- */
    /* Wishlist                                                          */
    /* ---------------------------------------------------------------- */

    K.getWishlist = function () {
        return read(WISH_KEY, []).filter(function (slug) { return !!bySlug[slug]; });
    };
    K.toggleWish = function (slug) {
        var ids = K.getWishlist();
        var idx = ids.indexOf(slug);
        var added;
        if (idx === -1) { ids.push(slug); added = true; }
        else { ids.splice(idx, 1); added = false; }
        write(WISH_KEY, ids);
        K.renderCounts();
        K.paintWishlist();
        return added;
    };
    K.isWished = function (slug) { return K.getWishlist().indexOf(slug) !== -1; };

    /* ---------------------------------------------------------------- */
    /* Auth (token/user mirror of the backend session)                  */
    /* ---------------------------------------------------------------- */

    K.getToken = function () {
        try { return window.localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
    };
    K.getUser = function () { return read(USER_KEY, null); };
    K.setUser = function (user, token) {
        if (user) write(USER_KEY, user); else try { window.localStorage.removeItem(USER_KEY); } catch (e) {}
        if (token) { try { window.localStorage.setItem(TOKEN_KEY, token); } catch (e) {} }
        else if (token === null) { try { window.localStorage.removeItem(TOKEN_KEY); } catch (e) {} }
    };
    K.isLoggedIn = function () { return !!K.getToken(); };

    /* ---------------------------------------------------------------- */
    /* API helper (only when served by the backend; silent when file://) */
    /* ---------------------------------------------------------------- */

    K.api = function (method, path, body) {
        if (K.isFileProtocol) {
            return Promise.resolve({ ok: false, network: true, data: null });
        }
        var opts = {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        };
        var token = K.getToken();
        if (token) opts.headers.Authorization = 'Bearer ' + token;
        if (body !== undefined) opts.body = JSON.stringify(body);
        return window.fetch('/api' + path, opts).then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (data) {
                return { ok: res.ok, status: res.status, data: data };
            });
        }).catch(function () {
            return { ok: false, network: true, data: null };
        });
    };

    /* ---------------------------------------------------------------- */
    /* Orders (front-end dev-mode order records, clearly marked DEMO)    */
    /* ---------------------------------------------------------------- */

    function demoOrderNumber() {
        var n = Math.floor(100000 + Math.random() * 899999);
        return 'KR-DEV-' + n;
    }

    K.getLastOrder = function () { return read(LAST_ORDER_KEY, null); };
    K.setLastOrder = function (order) { write(LAST_ORDER_KEY, order); };
    K.getPendingOrder = function () { return read(PENDING_KEY, null); };
    K.setPendingOrder = function (order) { write(PENDING_KEY, order); };
    K.clearPendingOrder = function () { try { window.localStorage.removeItem(PENDING_KEY); } catch (e) {} };

    /* Completes the checkout: records a clearly-labelled DEV order unless a
     * real order payload is provided by the caller (backend order). */
    K.completeOrder = function (opts) {
        opts = opts || {};
        var pending = opts.pending || K.getPendingOrder();
        if (!pending) return null;
        var lines = pending.lines || [];
        var totals = pending.totals || K.cartTotals();
        var order = {
            no: opts.orderNo || demoOrderNumber(),
            demo: !opts.real,
            createdAt: new Date().toISOString(),
            lines: lines,
            totals: totals,
            contact: pending.contact || null,
            address: pending.address || null,
            payment: { method: pending.paymentMethod || 'card', status: 'paid' }
        };
        K.setLastOrder(order);
        K.clearPendingOrder();
        K.buyNowClear();
        if (!(lines[0] && lines[0].buyNow)) K.clearCart();
        K.renderCounts();
        return order;
    };

    /* ---------------------------------------------------------------- */
    /* UI: counts, wishlist paint, toast, size modal                     */
    /* ---------------------------------------------------------------- */

    K.renderCounts = function () {
        var count = K.cartCount();
        var bag = document.getElementById('bag-count');
        if (bag) {
            bag.textContent = count;
            bag.classList.toggle('hidden', count === 0);
            var bagLink = bag.closest('a');
            if (bagLink) bagLink.setAttribute('aria-label', 'Shopping bag with ' + count + ' item' + (count === 1 ? '' : 's'));
        }
        var wishCount = K.getWishlist().length;
        var wc = document.getElementById('wishlist-count');
        if (wc) {
            wc.textContent = wishCount;
            wc.classList.toggle('hidden', wishCount === 0);
        }
    };

    K.paintWishlist = function () {
        var ids = K.getWishlist();
        document.querySelectorAll('[data-wishlist]').forEach(function (btn) {
            var slug = btn.getAttribute('data-wishlist');
            if (!bySlug[slug]) return;
            var active = ids.indexOf(slug) !== -1;
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
            var icon = btn.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.classList.toggle('icon-fill', active);
                icon.classList.toggle('text-deep-rose', active);
                icon.style.fontVariationSettings = active ? "'FILL' 1, 'wght' 300" : "'FILL' 0, 'wght' 300";
            }
        });
    };

    var toastTimer = null;
    K.toast = function (msg) {
        var toast = document.getElementById('toast');
        var text = document.getElementById('toast-text');
        if (!toast || !text) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.setAttribute('aria-live', 'polite');
            toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[calc(100%-2.5rem)] max-w-sm hidden';
            toast.innerHTML = '<div class="bg-dark-espresso text-rose-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3"><span aria-hidden="true" class="material-symbols-outlined text-rose-gold">check_circle</span><p class="text-[0.85rem] font-medium" id="toast-text"></p></div>';
            document.body.appendChild(toast);
            text = toast.querySelector('#toast-text');
        }
        if (!text) return;
        text.textContent = msg;
        toast.classList.remove('hidden', 'toast-slide');
        void toast.offsetWidth;
        toast.classList.add('toast-slide');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.classList.add('hidden'); }, 2400);
    };

    var sizeModal = null;
    function ensureSizeModal() {
        if (sizeModal) return sizeModal;
        var wrap = document.createElement('div');
        wrap.className = 'fixed inset-0 z-[95] hidden';
        wrap.innerHTML =
            '<div class="absolute inset-0 bg-dark-espresso/45 backdrop-blur-sm" data-sm-close></div>' +
            '<div role="dialog" aria-modal="true" aria-label="Select your size" class="absolute bottom-0 md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:max-w-md bg-rose-white md:rounded-3xl rounded-t-3xl p-7 shadow-2xl">' +
            '<div class="flex items-center justify-between mb-1"><h3 class="font-serif-brand text-[1.25rem] text-dark-espresso tracking-wide">SELECT YOUR SIZE</h3>' +
            '<button aria-label="Close" class="text-dark-espresso/60 hover:text-deep-rose p-1" data-sm-close type="button"><span class="material-symbols-outlined">close</span></button></div>' +
            '<p class="text-[0.8rem] text-dark-espresso/60 mb-4">Standard KARAVYA fit. Unsure? Consult the size guide.</p>' +
            '<div class="grid grid-cols-3 gap-2 mb-6" data-sm-sizes></div>' +
            '<a class="block text-center text-[0.7rem] tracking-[0.18em] uppercase text-deep-rose border-b border-rose-gold/60 pb-0.5 w-max mx-auto mb-5 hover:text-dark-espresso transition-colors" href="fit-studio.html">Size Guide</a>' +
            '<button class="w-full rounded-full bg-deep-rose text-rose-white text-[0.8rem] font-semibold tracking-[0.2em] uppercase py-4 hover:bg-dark-espresso transition-colors" data-sm-go type="button">CONTINUE</button>' +
            '</div>';
        document.body.appendChild(wrap);
        sizeModal = wrap;
        var close = function () { wrap.classList.add('hidden'); };
        wrap.querySelectorAll('[data-sm-close]').forEach(function (el) { el.addEventListener('click', close); });
        return sizeModal;
    }

    K.askSize = function (product, buttonLabel, onPick) {
        if (!product.sizes.length) { onPick(''); return; }
        var wrap = ensureSizeModal();
        var sizesBox = wrap.querySelector('[data-sm-sizes]');
        sizesBox.innerHTML = '';
        var chosen = null;
        product.sizes.forEach(function (s) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'rounded-xl border border-dark-espresso/20 py-3 text-[0.85rem] font-semibold text-dark-espresso hover:border-deep-rose hover:text-deep-rose transition-colors';
            btn.textContent = s;
            btn.addEventListener('click', function () {
                sizesBox.querySelectorAll('button').forEach(function (b) {
                    b.classList.remove('border-deep-rose', 'bg-deep-rose', 'text-rose-white');
                    b.classList.add('border-dark-espresso/20');
                });
                btn.classList.add('border-deep-rose', 'bg-deep-rose', 'text-rose-white');
                chosen = s;
            });
            sizesBox.appendChild(btn);
        });
        var go = wrap.querySelector('[data-sm-go]');
        go.textContent = buttonLabel || 'CONTINUE';
        var old = go.onclick;
        go.onclick = null;
        go.addEventListener('click', function handler() {
            if (!chosen) { K.toast('Please select your size'); return; }
            go.removeEventListener('click', handler);
            wrap.classList.add('hidden');
            onPick(chosen);
        });
        wrap.classList.remove('hidden');
    };

    /* ---------------------------------------------------------------- */
    /* Product card helpers (for grids rendered from the registry)       */
    /* ---------------------------------------------------------------- */

    K.cardHTML = function (slug, opts) {
        opts = opts || {};
        var p = bySlug[slug];
        if (!p) return '';
        var soldOut = p.availability === 'out_of_stock';
        var compare = p.compareAt ? '<span class="text-[0.85rem] text-dark-espresso/45 line-through">' + K.fmtINR(p.compareAt) + '</span>' : '';
        var stockNote = p.availability === 'low_stock' ? '<p class="mt-1 text-[0.7rem] uppercase tracking-[0.15em] text-amber-700 font-semibold">Low stock</p>' : '';
        return (
            '<article class="group reveal">' +
            '<div class="relative rounded-3xl overflow-hidden img-frame aspect-[3/4]">' +
            '<a aria-label="' + p.name + '" class="block w-full h-full" href="' + K.productUrl(slug) + '">' +
            '<img alt="' + p.name + '" class="w-full h-full object-cover object-top transition-transform duration-[1.2s] group-hover:scale-105" decoding="async" loading="lazy" src="' + p.images[0] + '"/>' +
            '</a>' +
            '<button aria-label="Add ' + p.name + ' to wishlist" aria-pressed="false" class="absolute top-4 right-4 w-10 h-10 rounded-full bg-rose-white/85 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition-transform" data-wishlist="' + slug + '" type="button"><span aria-hidden="true" class="material-symbols-outlined text-[1.25rem] text-dark-espresso">favorite</span></button>' +
            (soldOut ? '<span class="absolute top-4 left-4 rounded-full bg-dark-espresso text-rose-white text-[0.65rem] font-semibold tracking-[0.15em] uppercase px-4 py-1.5">Sold out</span>' : '') +
            '</div>' +
            '<div class="pt-4 px-1">' +
            '<a class="block font-serif-brand text-[1.05rem] md:text-[1.15rem] text-dark-espresso hover:text-deep-rose transition-colors" href="' + K.productUrl(slug) + '">' + p.name + '</a>' +
            '<div class="flex items-center gap-2 mt-1.5"><span class="text-[0.95rem] font-semibold text-dark-espresso">' + K.fmtINR(p.price) + '</span>' + compare + '</div>' +
            '<div aria-hidden="true" class="flex items-center gap-1.5 mt-2.5">' + p.colors.slice(0, 4).map(function (c) { return '<span class="w-3.5 h-3.5 rounded-full border border-dark-espresso/15" style="background:' + c.hex + '"></span>'; }).join('') + '</div>' +
            stockNote +
            '<button class="mt-4 w-full rounded-full border border-deep-rose/40 text-deep-rose text-[0.75rem] font-semibold tracking-[0.16em] uppercase py-3 hover:bg-deep-rose hover:text-rose-white transition-colors duration-300" data-add-to-bag="' + slug + '" type="button"' + (soldOut ? ' disabled style="opacity:0.45;cursor:not-allowed"' : '') + '>' + (soldOut ? 'Sold Out' : 'Add to Bag') + '</button>' +
            '</div></article>'
        );
    };

    K.renderGrid = function (container, slugs) {
        if (!container) return;
        container.innerHTML = slugs.map(function (s) { return K.cardHTML(s); }).join('');
    };

    /* Fill a static card (article) from the registry. Targets:
     *   [data-card-img] img[src]   [data-card-name] text   [data-card-price] text
     *   [data-card-compare] text   [data-card-link] href  */
    K.attachCard = function (el, slug) {
        var p = bySlug[slug];
        if (!p || !el) return;
        var img = el.querySelector('[data-card-img]');
        if (img) img.src = p.images[0];
        var name = el.querySelector('[data-card-name]');
        if (name) name.textContent = p.name;
        var price = el.querySelector('[data-card-price]');
        if (price) price.textContent = K.fmtINR(p.price);
        var compare = el.querySelector('[data-card-compare]');
        if (compare) compare.textContent = p.compareAt ? K.fmtINR(p.compareAt) : '';
        var link = el.querySelector('[data-card-link]');
        if (link) link.setAttribute('href', K.productUrl(slug));
        var btns = el.querySelectorAll('[data-add-to-bag]');
        btns.forEach(function (b) { b.setAttribute('data-add-to-bag', slug); });
        var wish = el.querySelectorAll('[data-wishlist]');
        wish.forEach(function (b) { b.setAttribute('data-wishlist', slug); });
    };

    /* ---------------------------------------------------------------- */
    /* Delegated interactions                                            */
    /* ---------------------------------------------------------------- */

    document.addEventListener('click', function (e) {
        var target = e.target;
        var addBtn = target.closest ? target.closest('[data-add-to-bag]') : null;
        if (addBtn) {
            var slug = addBtn.getAttribute('data-add-to-bag');
            var p = bySlug[slug];
            if (!p) return;
            if (p.availability === 'out_of_stock') { K.toast('This piece is currently sold out.'); return; }
            if (p.sizes.length) {
                K.askSize(p, 'CONTINUE TO BAG', function (size) {
                    var res = K.addToCart(slug, { size: size });
                    K.toast(res.ok ? res.message : res.message);
                    if (res.ok && window.KARAVYA_CART_REFRESH) window.KARAVYA_CART_REFRESH();
                });
            } else {
                var res2 = K.addToCart(slug, {});
                K.toast(res2.message);
                if (res2.ok && window.KARAVYA_CART_REFRESH) window.KARAVYA_CART_REFRESH();
            }
            return;
        }

        var buyBtn = target.closest ? target.closest('[data-buy-now]') : null;
        if (buyBtn) {
            var slugB = buyBtn.getAttribute('data-buy-now');
            var pB = bySlug[slugB];
            if (!pB) return;
            if (pB.availability === 'out_of_stock') { K.toast('This piece is currently sold out.'); return; }
            var qty = parseInt(buyBtn.getAttribute('data-qty') || '1', 10) || 1;
            if (pB.sizes.length) {
                K.askSize(pB, 'CONTINUE TO CHECKOUT', function (size) {
                    var res = K.buyNowSet(slugB, { size: size, qty: qty });
                    if (res.ok) window.location.href = 'checkout.html';
                    else K.toast(res.message);
                });
            } else {
                var res3 = K.buyNowSet(slugB, { qty: qty });
                if (res3.ok) window.location.href = 'checkout.html';
                else K.toast(res3.message);
            }
            return;
        }

        var wishBtn = target.closest ? target.closest('[data-wishlist]') : null;
        if (wishBtn) {
            var slugW = wishBtn.getAttribute('data-wishlist');
            if (!bySlug[slugW]) return;
            var added = K.toggleWish(slugW);
            K.toast(added ? 'Saved to wishlist' : 'Removed from wishlist');
            var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (added && !reduceMotion) {
                wishBtn.classList.remove('heart-pop');
                void wishBtn.offsetWidth;
                wishBtn.classList.add('heart-pop');
            }
            return;
        }
    });

    /* Newsletter forms (shared behaviour, same as the homepage) */
    document.addEventListener('submit', function (e) {
        var form = e.target;
        if (!form || !form.hasAttribute || !form.hasAttribute('data-newsletter')) return;
        e.preventDefault();
        var input = form.querySelector('input[type="email"]');
        var msg = form.parentElement ? form.parentElement.querySelector('[data-newsletter-msg]') : null;
        if (!input) return;
        var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        if (!valid) {
            if (msg) { msg.textContent = 'PLEASE ENTER A VALID EMAIL.'; msg.className = 'mt-4 text-[0.85rem] text-red-700'; }
            input.focus();
            return;
        }
        if (msg) { msg.textContent = 'WELCOME TO KARAVYA.'; msg.className = 'mt-4 text-[0.85rem] font-semibold text-deep-rose'; }
        var btn = form.querySelector('button[type="submit"], button');
        if (btn) { btn.textContent = 'Joined'; btn.disabled = true; }
        input.value = '';
    });

    /* ---------------------------------------------------------------- */
    /* Boot                                                              */
    /* ---------------------------------------------------------------- */

    K.renderCounts();
    K.paintWishlist();

    if (document.readyState !== 'loading') {
        setTimeout(function () { K.renderCounts(); K.paintWishlist(); }, 0);
    } else {
        document.addEventListener('DOMContentLoaded', function () { K.renderCounts(); K.paintWishlist(); });
    }

    /* Mobile: point links at their -mobile pages directly so the desktop
       page never loads (and never flashes) before redirecting. Runs after
       load when the viewport width is real. */
    var DUAL_PAGES = ['account', 'checkout', 'collections', 'concierge', 'editorial', 'fit-studio', 'gift-studio', 'lookbook', 'order-confirmation', 'private-wardrobe', 'quiz-results', 'returns', 'robe', 'search', 'wishlist'];
    function patchMobileLinks() {
        if (!window.matchMedia('(max-width: 767px)').matches) return;
        var target = {};
        DUAL_PAGES.forEach(function (p) { target[p + '.html'] = p + '-mobile.html'; });
        document.querySelectorAll('a[href]').forEach(function (a) {
            var h = a.getAttribute('href');
            var base = h.split('?')[0].split('#')[0];
            if (target[base]) a.setAttribute('href', target[base] + h.slice(base.length));
        });
    }
    if (document.readyState !== 'loading') {
        setTimeout(patchMobileLinks, 0);
    } else {
        document.addEventListener('DOMContentLoaded', patchMobileLinks);
    }

})(window, document);