lrm_version = 3.0.3

setup:
	if [ ! -d lib/walkabout ]; then git clone https://github.com/tangrams/walkabout-style-more-labels.git lib/walkabout; fi;
	if [ ! -d lib/lrm-mapzen ]; then git clone https://github.com/mapzen/lrm-mapzen.git lib/lrm-mapzen; fi;
	if [ ! -d lib/leaflet-routing-machine ]; then curl -O -L https://github.com/perliedman/leaflet-routing-machine/archive/v$(lrm_version).zip && unzip v$(lrm_version).zip && mv leaflet-routing-machine-$(lrm_version) lib/leaflet-routing-machine && rm v$(lrm_version).zip; fi;
