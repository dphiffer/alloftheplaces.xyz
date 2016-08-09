lrm_version = 3.0.3
jquery_version = 3.1.0
bootstrap_version = 3.3.6

setup:
	if [ ! -d lib/walkabout ]; then git clone https://github.com/tangrams/walkabout-style-more-labels.git lib/walkabout; fi;
	if [ ! -d lib/lrm-mapzen ]; then git clone https://github.com/mapzen/lrm-mapzen.git lib/lrm-mapzen; fi;
	if [ ! -d lib/leaflet-routing-machine ]; then curl -O -L https://github.com/perliedman/leaflet-routing-machine/archive/v$(lrm_version).zip && unzip v$(lrm_version).zip && mv leaflet-routing-machine-$(lrm_version) lib/leaflet-routing-machine && rm v$(lrm_version).zip; fi;
	if [ ! -f lib/jquery.min.js ]; then curl -o lib/jquery.min.js -L https://code.jquery.com/jquery-$(jquery_version).min.js; fi;
	if [ ! -d lib/bootstrap ]; then curl -O -L https://github.com/twbs/bootstrap/releases/download/v$(bootstrap_version)/bootstrap-$(bootstrap_version)-dist.zip && unzip bootstrap-$(bootstrap_version)-dist.zip && mv bootstrap-$(bootstrap_version)-dist lib/bootstrap && rm bootstrap-$(bootstrap_version)-dist.zip; fi;
	if [ ! -f lib/mapzen.whosonfirst.data.js ]; then curl -o lib/mapzen.whosonfirst.data.js -L https://raw.githubusercontent.com/whosonfirst/js-mapzen-whosonfirst/master/src/mapzen.whosonfirst.data.js; fi;
