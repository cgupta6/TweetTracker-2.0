import os
import sys

sys.path.append('/var/www/tt/trunk')

import monitor
monitor.start(interval=1.0)
monitor.track(os.path.dirname(__file__))

from server import app as application
