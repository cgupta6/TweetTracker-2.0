"""
    This is a collection of things we SHOULD NOT need, but do for the time being...
"""

"""
    For some reason we store the 'type' as an arbitrary number ... this is bullshit!
"""
type_to_str = {
    1: 'tweet'
}
convert_type = lambda x: type_to_str.get(x, "unknown")

"""
    For some reason we store the 'lang-code' as an arbitrary number ... this is bullshit!
"""
lang_num_to_iso_639 = {
    1: "af",
    2: "ar",
    3: "bg",
    4: "bn",
    5: "cs",
    6: "da",
    7: "de",
    8: "el",
    9: "en",
    10: "es",
    11: "fa",
    12: "fi",
    13: "fr",
    14: "gu",
    15: "he",
    16: "hi",
    17: "hr",
    18: "hu",
    19: "id",
    20: "it",
    21: "ja",
    22: "kn",
    23: "ko",
    51: "lt",
    52: "lv",
    24: "mk",
    25: "ml",
    26: "mr",
    27: "ne",
    28: "nl",
    29: "no",
    30: "pa",
    31: "pl",
    32: "pt",
    33: "ro",
    34: "ru",
    35: "sk",
    50: "sl",
    36: "so",
    37: "sq",
    38: "sv",
    39: "sw",
    40: "ta",
    41: "te",
    42: "th",
    43: "tl",
    44: "tr",
    45: "uk",
    46: "ur",
    47: "vi",
    48: "zh",
    49: "zhtw",
    50: "in",
    51: "ht",
    52: "hy",
    # 53: "is",
    53: "et",
    54: "my",
    55: "bo",
    56: "ka",
    999: "und"
}

convert_lang_code = lambda x: lang_num_to_iso_639.get(x, "und")