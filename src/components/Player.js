import React, { useState, useEffect, useRef } from 'react';
import { formatTime } from '../utils/timeUtils';
import { fetchVideoInfo } from '../services/apiService';
import './Player.css'; 