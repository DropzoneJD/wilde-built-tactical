#!/usr/bin/env python3
"""
build_ffl_data.py — turn the real ATF Listing of Federal Firearms Licensees into
a geocoded, slimmed JSON the storefront FFL finder fetches at runtime.

Inputs (downloaded into ../../.ffl_build by the build step, not committed):
  - atf_0315.txt                  ATF FFL flat file (tab-delimited). Real ATF data.
                                  Source: github.com/helloworlddata/atf-federal-firearms-licensees
  - 2023_Gaz_zcta_national.txt    US Census ZCTA gazetteer (ZIP -> centroid lat/long, public domain)

Output:
  - ../assets/ffl-data.json       { source, count, dealers:[{lic,name,type,street,city,state,zip,lat,lng,phone}] }

We geocode each FFL by its premise ZIP (city-level centroid) and add a small
deterministic jitter so multiple dealers in one ZIP don't stack on a single pin.
"""
import csv, json, re, hashlib, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.normpath(os.path.join(HERE, '..', '..', '.ffl_build'))
OUT = os.path.normpath(os.path.join(HERE, '..', 'assets', 'ffl-data.json'))

STATE = (sys.argv[1] if len(sys.argv) > 1 else 'CA').upper()
TYPES = {'01': 'Dealer', '02': 'Pawnbroker'}   # license types relevant to retail transfers


def load_zip_centroids(path):
    z = {}
    with open(path, encoding='latin-1') as f:
        r = csv.reader(f, delimiter='\t')
        next(r, None)  # header: GEOID ALAND AWATER ALAND_SQMI AWATER_SQMI INTPTLAT INTPTLONG
        for row in r:
            if len(row) < 7:
                continue
            zc = row[0].strip().zfill(5)
            try:
                z[zc] = (float(row[5]), float(row[6].strip()))
            except ValueError:
                pass
    return z


def nice(s):
    s = (s or '').strip()
    return s.title() if s.isupper() else s


def clean(s):
    s = (s or '').strip()
    return '' if s.upper() in ('NULL', 'NONE', 'N/A', '') else s


def person(name):
    # "LAST, FIRST MIDDLE" -> "First Middle Last"
    if ',' in name:
        a, b = name.split(',', 1)
        name = (b.strip() + ' ' + a.strip()).strip()
    return name


def display_name(biz, lic):
    b = clean(biz)
    if b:
        return nice(b)
    l = clean(lic)
    if l:
        return nice(person(l))
    return None


def main():
    zipc = load_zip_centroids(os.path.join(BUILD, '2023_Gaz_zcta_national.txt'))
    out, skipped_zip = [], 0
    with open(os.path.join(BUILD, 'atf_0315.txt'), encoding='latin-1') as f:
        r = csv.reader(f, delimiter='\t')
        next(r, None)   # header
        next(r, None)   # dashes separator row
        for row in r:
            if len(row) < 12:
                continue
            regn, dist, cnty, ltype, xpr, seqn = (row[i].strip() for i in range(6))
            licname, bizname, street, city, state, zc = (row[i].strip() for i in range(6, 12))
            if state != STATE or ltype not in TYPES:
                continue
            z5 = re.sub(r'\D', '', zc)[:5].zfill(5) if zc else ''
            cen = zipc.get(z5)
            if not cen:
                skipped_zip += 1
                continue
            h = int(hashlib.md5((regn + dist + cnty + xpr + seqn).encode()).hexdigest(), 16)
            jlat = ((h % 1000) / 1000 - 0.5) * 0.012        # ~+-0.4 mi spread
            jlng = (((h // 1000) % 1000) / 1000 - 0.5) * 0.012
            name = display_name(bizname, licname)
            if not name:
                continue
            phone = re.sub(r'\D', '', row[16]) if len(row) > 16 else ''
            out.append({
                'lic': f'{regn.lstrip("0") or "0"}-{dist}-{cnty}-{ltype}-{xpr}-{seqn}',
                'name': name,
                'type': TYPES[ltype],
                'street': nice(street), 'city': nice(city), 'state': state, 'zip': z5,
                'lat': round(cen[0] + jlat, 5), 'lng': round(cen[1] + jlng, 5),
                'phone': phone,
            })
    out.sort(key=lambda d: (d['city'], d['name']))
    payload = {
        'source': 'ATF Listing of Federal Firearms Licensees (Mar 2015), geocoded by premises ZIP using US Census ZCTA centroids',
        'state': STATE, 'count': len(out), 'dealers': out,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, separators=(',', ':'))
    size = os.path.getsize(OUT)
    print(f'{STATE}: wrote {len(out)} FFL dealers ({size//1024} KB) -> {OUT}')
    print(f'  (skipped {skipped_zip} with unmappable ZIP)')


if __name__ == '__main__':
    main()
